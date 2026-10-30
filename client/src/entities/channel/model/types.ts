import type { components } from '@/shared/api/schema';

export type ChannelSummary = components['schemas']['ChannelSummaryDto'];
export type ChannelDetail = components['schemas']['ChannelDetailDto'];
export type ChannelType = components['schemas']['ChannelType']; // 1 = Direct, 2 = Group
export type CreateChannelPayload = components['schemas']['CreateChannelRequest'];

export type ChannelMember = components['schemas']['ChannelMemberDto'];
export type ChannelMemberRole = components['schemas']['ChannelMemberRole'];
export type AddChannelMembersPayload = components['schemas']['AddChannelMembersRequest'];
export type UpdateChannelPayload = components['schemas']['UpdateChannelRequest'];
export type UpdateChannelMemberRolePayload = components['schemas']['UpdateChannelMemberRoleRequest'];

export const CHANNEL_TYPE = {
  DIRECT: 1,
  GROUP: 2,
} as const;

export const CHANNEL_MEMBER_ROLE = {
  OWNER: 1,
  ADMIN: 2,
  MEMBER: 3,
} as const;
