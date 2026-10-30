import type { UpdateProfileRequest } from '@/entities/user';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username can only contain letters, numbers, underscores, and dots'),
  avatarUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const _assertUpdateProfile: UpdateProfileRequest = {} as {
  username: string;
  avatarUrl: string | null;
};
