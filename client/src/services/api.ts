import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthResponse } from "../types";

const baseURL = import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || "/api";

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const onAuthFailure = (handler: () => void) => {
  authFailureHandler = handler;
};

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const refreshSession = (): Promise<AuthResponse | null> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
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
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Naməlum xəta baş verdi";
};
