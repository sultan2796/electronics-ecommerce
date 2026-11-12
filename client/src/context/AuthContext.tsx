import { extraService } from "../services/extra.service";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthFailure, refreshSession, setAccessToken } from "../services/api";
import { authService } from "../services/auth.service";
import { AuthResponse, Permission, User } from "../types";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  can: (permission: Permission) => boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<User>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const roleLabels: Record<User["role"], string> = {
  ADMIN: "Admin",
  MANAGER: "Menecer",
  SUPPORT: "Dəstək",
  CUSTOMER: "Müştəri",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((session: AuthResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  useEffect(() => {
    onAuthFailure(() => setUser(null));
    refreshSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => applySession(await authService.login({ email, password })),
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) =>
      applySession(await authService.register({ name, email, password })),
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const updated = await authService.updateProfile(name);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      applySession(await authService.changePassword(currentPassword, newPassword));
    },
    [applySession],
  );

  const can = useCallback((permission: Permission) => Boolean(user?.permissions?.includes(permission)), [user]);

  const googleLogin = useCallback(
    async (credential: string) => applySession((await extraService.googleLogin(credential)) as AuthResponse),
    [applySession],
  );

  const reloadUser = useCallback(async () => {
    try {
      setUser(await authService.me());
    } catch {
      return;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === "ADMIN",
      isStaff: can("dashboard:read"),
      can,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      googleLogin,
      reloadUser,
    }),
    [user, initializing, can, login, register, logout, updateProfile, changePassword, googleLogin, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
