import { api } from '@/shared/api';
import type { components } from '@/shared/api';
import type { MessageDto, MessagesCursorResponse, SendMessagePayload, SearchMessagesResponse } from '../model/types';

export type ToggleReactionResponse = components['schemas']['ToggleReactionResponse'];

export const messageApi = {
  getChannelMessages: async (
    channelId: string,
    before?: string | null,
    limit = 20
  ): Promise<MessagesCursorResponse> => {
    return api.get<MessagesCursorResponse>(`/Channels/${channelId}/messages`, {
      params: { before: before || undefined, limit },
    });
  },

  searchChannelMessages: async (
    channelId: string,
    query: string,
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
  ): Promise<SearchMessagesResponse> => {
    return api.get<SearchMessagesResponse>(`/Channels/${channelId}/messages/search`, {
      params: { query, page, pageSize },
      signal,
    });
  },

  sendMessage: async (channelId: string, payload: SendMessagePayload): Promise<MessageDto> => {
    return api.post<MessageDto>(`/Channels/${channelId}/messages`, payload);
  },

  toggleReaction: async (messageId: string, emoji: string): Promise<ToggleReactionResponse> => {
    return api.post<ToggleReactionResponse>(`/Messages/${messageId}/reactions`, { emoji });
  },
};
