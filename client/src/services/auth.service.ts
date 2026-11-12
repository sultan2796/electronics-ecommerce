import { AuthResponse, User } from "../types";
import { api } from "./api";

export const authService = {
  register: (payload: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ user: User }>("/auth/me").then((r) => r.data.user),
  updateProfile: (name: string) => api.patch<{ user: User }>("/auth/me", { name }).then((r) => r.data.user),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<AuthResponse>("/auth/change-password", { currentPassword, newPassword }).then((r) => r.data),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data),
  validateResetToken: (token: string) =>
    api.get<{ valid: boolean }>("/auth/reset-password/validate", { params: { token } }).then((r) => r.data.valid),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, password }).then((r) => r.data),
};
