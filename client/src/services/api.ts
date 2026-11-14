import { syncServerClock } from "../utils/serverClock";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthResponse } from "../types";

const normalizeApiUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const configuredApiUrl = normalizeApiUrl(import.meta.env.VITE_API_URL ?? "");

export const apiOrigin = import.meta.env.DEV ? "/api" : configuredApiUrl || "/api";

export const apiIsConfigured = import.meta.env.DEV || Boolean(configuredApiUrl);

const baseURL = apiOrigin;

const BACKEND_MISSING =
  "Server API-si tapılmadı. Vercel-də VITE_API_URL dəyişənini backend ünvanı ilə təyin edin (məsələn https://electroshop-api.onrender.com/api) və yenidən deploy edin.";

export class ApiUnavailableError extends Error {
  constructor(message = BACKEND_MISSING) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

let accessToken: string | null = null;
let requestLocale = "az";

export const setRequestLocale = (locale: string) => {
  requestLocale = locale;
};
let refreshPromise: Promise<AuthResponse | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const onAuthFailure = (handler: () => void) => {
  authFailureHandler = handler;
};

export const api = axios.create({ baseURL, withCredentials: true });

const looksLikeHtml = (response: { headers: unknown; data: unknown }) => {
  const headers = response.headers as Record<string, string> | undefined;
  const type = headers?.["content-type"] ?? "";
  return type.includes("text/html") || (typeof response.data === "string" && response.data.trimStart().startsWith("<"));
};

api.interceptors.response.use((response) => {
  if (looksLikeHtml(response)) throw new ApiUnavailableError();
  syncServerClock(response.headers?.["x-server-time"]);
  return response;
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  config.headers["X-Locale"] = requestLocale;
  return config;
});

export const refreshSession = (): Promise<AuthResponse | null> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        if (!response.data || typeof response.data !== "object" || !response.data.accessToken) {
          setAccessToken(null);
          return null;
        }
        setAccessToken(response.data.accessToken);
        return response.data;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const session = await refreshSession();
      if (session) return api(original);
      authFailureHandler?.();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiUnavailableError) return error.message;
  if (axios.isAxiosError(error)) {
    if (!error.response) return apiIsConfigured ? "Serverə qoşulmaq mümkün olmadı. İnternet bağlantısını və ya backend-in işlək olduğunu yoxlayın." : BACKEND_MISSING;
    if (error.response.status === 404 && !apiIsConfigured) return BACKEND_MISSING;
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Naməlum xəta baş verdi";
};
