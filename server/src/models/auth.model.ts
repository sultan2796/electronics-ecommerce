import { z } from "zod";

const password = z.string().min(8, "Şifrə ən az 8 simvol olmalıdır").max(128);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password,
  name: z.string().trim().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Yeni şifrə köhnəsindən fərqli olmalıdır",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(200),
  password,
});

export const resetTokenQuerySchema = z.object({ token: z.string().min(32).max(200) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
