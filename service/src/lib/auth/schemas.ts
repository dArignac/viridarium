import { z } from "zod";
import { StrongPasswordSchema } from "./password";

export const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: StrongPasswordSchema,
  displayName: z.string().min(1).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
