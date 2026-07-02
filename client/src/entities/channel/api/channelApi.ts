import { api } from '@/shared/api';
import type { ChannelSummary, ChannelDetail, CreateChannelPayload } from '../model/types';

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
};



