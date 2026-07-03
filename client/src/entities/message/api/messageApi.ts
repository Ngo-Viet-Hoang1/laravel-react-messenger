import { api } from '@/shared/api';
import type { MessageDto, MessagesCursorResponse, SendMessagePayload } from '../model/types';

export const messageApi = {
  getChannelMessages: async (
    channelId: string,
    before?: string | null,
    limit = 50
  ): Promise<MessagesCursorResponse> => {
    return api.get<MessagesCursorResponse>(`/Channels/${channelId}/messages`, {
      params: { before: before || undefined, limit },
    });
  },

  sendMessage: async (channelId: string, payload: SendMessagePayload): Promise<MessageDto> => {
    return api.post<MessageDto>(`/Channels/${channelId}/messages`, payload);
  },
};
