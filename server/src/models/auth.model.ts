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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
