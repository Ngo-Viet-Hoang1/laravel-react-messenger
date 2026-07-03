import { z } from 'zod';
import type { UpdateChannelPayload } from '@/entities/channel';

export const updateChannelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Channel name must be at least 2 characters')
    .max(100, 'Channel name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export type UpdateChannelFormValues = z.infer<typeof updateChannelSchema>;

// Compile-time assertion matching OpenAPI UpdateChannelRequest
export const _assertUpdatePayload: UpdateChannelPayload = {} as UpdateChannelFormValues;
