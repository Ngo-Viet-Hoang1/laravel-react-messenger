import { api } from '@/shared/api';
import type {
  ChannelSummary,
  ChannelDetail,
  CreateChannelPayload,
  ChannelMember,
  ChannelMemberRole,
  UpdateChannelPayload,
} from '../model/types';

export const channelApi = {
  getUserChannels: (): Promise<ChannelSummary[]> =>
    api.get<ChannelSummary[]>('/Channels'),

  getChannelById: (channelId: string): Promise<ChannelDetail> =>
    api.get<ChannelDetail>(`/Channels/${channelId}`),

  createChannel: (payload: CreateChannelPayload): Promise<ChannelDetail> =>
    api.post<ChannelDetail>('/Channels', payload),

  getOrCreateDirectChannel: (targetUserId: string): Promise<ChannelDetail> =>
    api.post<ChannelDetail>(`/Channels/direct/${targetUserId}`),

  markAsRead: (channelId: string): Promise<void> =>
    api.post<void>(`/Channels/${channelId}/read`),

  getChannelMembers: (channelId: string): Promise<ChannelMember[]> =>
    api.get<ChannelMember[]>(`/Channels/${channelId}/members`),

  addChannelMembers: (channelId: string, memberIds: string[]): Promise<number> =>
    api.post<number>(`/Channels/${channelId}/members`, { memberIds }),

  updateChannel: (channelId: string, payload: UpdateChannelPayload): Promise<ChannelDetail> =>
    api.put<ChannelDetail>(`/Channels/${channelId}`, payload),

  updateChannelMemberRole: (
    channelId: string,
    userId: string,
    role: ChannelMemberRole
  ): Promise<void> =>
    api.put<void>(`/Channels/${channelId}/members/${userId}/role`, { role }),

  transferOwnership: (channelId: string, newOwnerId: string): Promise<void> =>
    api.post<void>(`/Channels/${channelId}/transfer-ownership`, { newOwnerId }),

  removeChannelMember: (channelId: string, userId: string): Promise<void> =>
    api.delete<void>(`/Channels/${channelId}/members/${userId}`),

  leaveChannel: (channelId: string): Promise<void> =>
    api.post<void>(`/Channels/${channelId}/leave`),

  deleteChannel: (channelId: string): Promise<void> =>
    api.delete<void>(`/Channels/${channelId}`),
};
