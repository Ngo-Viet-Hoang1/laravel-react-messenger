import type { components } from '@/shared/api/schema';

export type ChannelSummary = components['schemas']['ChannelSummaryDto'];
export type ChannelDetail = components['schemas']['ChannelDetailDto'];
export type ChannelType = components['schemas']['ChannelType']; // 1 = Direct, 2 = Group
export type CreateChannelPayload = components['schemas']['CreateChannelRequest'];

export const CHANNEL_TYPE = {
  DIRECT: 1,
  GROUP: 2,
} as const;

