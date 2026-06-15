import { z } from 'zod';
import type { components } from '@/shared/api';

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email is required.')
      .email('Invalid email address format.')
      .max(256, 'Email cannot exceed 256 characters.'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(50, 'Username cannot exceed 50 characters.')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dashes, and dots.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password cannot exceed 128 characters.')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Must contain at least one number.')
      .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const _assertRegisterCompat: components['schemas']['RegisterCommand'] = {} as Omit<RegisterFormData, 'confirmPassword'>;
