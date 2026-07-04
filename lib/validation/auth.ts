import { z } from "zod";
import { PASSWORD_RULES, NAME_RULES, MESSAGES } from "@/lib/messages";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_RULES.MIN_LENGTH, MESSAGES.NAME_MIN)
    .max(80, "Name must be at most 80 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(MESSAGES.EMAIL_INVALID),
  password: z
    .string()
    .min(PASSWORD_RULES.MIN_LENGTH, MESSAGES.PASSWORD_MIN_LENGTH)
    .max(100, "Password must be at most 100 characters.")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, MESSAGES.PASSWORD_NEEDS_DIGIT),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, MESSAGES.EMAIL_REQUIRED),
  password: z.string().min(1, MESSAGES.PASSWORD_REQUIRED),
});
export type LoginInput = z.infer<typeof loginSchema>;
