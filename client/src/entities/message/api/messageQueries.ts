import { useQuery } from '@tanstack/react-query';
import { messageApi } from './messageApi';
import type { ChatMessage } from '../model/types';

export const messageKeys = {
  all: ['messages'] as const,
  byChannel: (channelId?: string) => [...messageKeys.all, channelId] as const,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useChannelMessagesQuery = (channelId?: string) => {
  const isValidGuid = Boolean(channelId && UUID_REGEX.test(channelId));

  return useQuery<ChatMessage[]>({
    queryKey: messageKeys.byChannel(channelId),
    queryFn: async () => {
      const messages = await messageApi.getChannelMessages(channelId!);
      return messages.map((m) => ({ ...m, status: 'sent' as const }));
    },
    enabled: isValidGuid,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};
