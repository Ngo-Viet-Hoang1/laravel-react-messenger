import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { messageApi } from './messageApi';
import { MESSAGE_STATUS, type ChatMessage } from '../model/types';

export const messageKeys = {
  all: ['messages'] as const,
  byChannel: (channelId?: string) => [...messageKeys.all, channelId] as const,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface MessagesPage {
  items: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type MessagesInfiniteData = InfiniteData<MessagesPage, string | null>;

export const useChannelMessagesQuery = (channelId?: string) => {
  const isValidGuid = Boolean(channelId && UUID_REGEX.test(channelId));

  return useInfiniteQuery<MessagesPage, Error, MessagesInfiniteData, readonly unknown[], string | null>({
    queryKey: messageKeys.byChannel(channelId),
    queryFn: async ({ pageParam }) => {
      const response = await messageApi.getChannelMessages(channelId!, pageParam);
      return {
        items: (response.items ?? []).map((m) => ({ ...m, status: MESSAGE_STATUS.SENT })),
        nextCursor: response.nextCursor ?? null,
        hasMore: Boolean(response.hasMore),
      };
    },
    initialPageParam: null,
    getPreviousPageParam: (firstPage) => (firstPage.hasMore ? firstPage.nextCursor : null),
    getNextPageParam: () => null,
    enabled: isValidGuid,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};
