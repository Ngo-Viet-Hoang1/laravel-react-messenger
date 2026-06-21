import { z } from 'zod';
import type { CreateChannelPayload } from '@/entities/channel';

export const createChannelSchema = z.object({
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
  memberIds: z.array(z.string().uuid()).optional(),
});

export type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

// Compile-time assertion matching OpenAPI CreateChannelRequest
export const _assertChannelPayload: CreateChannelPayload = {} as CreateChannelFormValues;
