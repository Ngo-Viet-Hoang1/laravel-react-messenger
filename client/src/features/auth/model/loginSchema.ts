import { z } from 'zod';
import type { components } from '@/shared/api';

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(1, 'Email or username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const _assertLoginCompat: components['schemas']['LoginCommand'] = {} as LoginFormData;
