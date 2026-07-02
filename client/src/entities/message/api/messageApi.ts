import { api } from '@/shared/api';
import type { MessageDto, SendMessagePayload } from '../model/types';

export const messageApi = {
  getChannelMessages: async (channelId: string, limit = 50): Promise<MessageDto[]> => {
    return api.get<MessageDto[]>(`/Channels/${channelId}/messages`, {
      params: { limit },
    });
  },

  sendMessage: async (channelId: string, payload: SendMessagePayload): Promise<MessageDto> => {
    return api.post<MessageDto>(`/Channels/${channelId}/messages`, payload);
  },
};
