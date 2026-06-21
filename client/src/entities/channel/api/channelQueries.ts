import { useQuery } from '@tanstack/react-query';
import { channelApi } from './channelApi';

export const channelKeys = {
  all: ['channels'] as const,
  lists: () => [...channelKeys.all, 'list'] as const,
  detail: (id?: string) => [...channelKeys.all, 'detail', id] as const,
};

export const useUserChannelsQuery = () => {
  return useQuery({
    queryKey: channelKeys.lists(),
    queryFn: channelApi.getUserChannels,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useChannelDetailQuery = (channelId?: string) => {
  const isValidGuid = Boolean(channelId && UUID_REGEX.test(channelId));

  return useQuery({
    queryKey: channelKeys.detail(channelId),
    queryFn: () => channelApi.getChannelById(channelId!),
    enabled: isValidGuid,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
