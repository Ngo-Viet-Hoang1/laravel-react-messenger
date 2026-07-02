import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { channelApi } from './channelApi';
import { channelKeys } from './channelQueries';
import type { ChannelDetail, ChannelSummary, CreateChannelPayload } from '../model/types';

export interface UseCreateChannelMutationOptions {
  onSuccess?: (channel: ChannelDetail) => void;
  onError?: (error: unknown) => void;
}

export const useCreateChannelMutation = (options?: UseCreateChannelMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => channelApi.createChannel(payload),
    onSuccess: (createdChannel) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      toast.success(`Channel #${createdChannel.name} created successfully!`);
      options?.onSuccess?.(createdChannel);
    },
    onError: (error: unknown) => {
      options?.onError?.(error);
    },
  });
};

export interface UseStartDirectChatMutationOptions {
  onSuccess?: (channel: ChannelDetail) => void;
  onError?: (error: unknown) => void;
}

export const useStartDirectChatMutation = (options?: UseStartDirectChatMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => channelApi.getOrCreateDirectChannel(targetUserId),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      toast.success(`Direct conversation opened with ${channel.name}!`);
      options?.onSuccess?.(channel);
    },
    onError: (error: unknown) => {
      options?.onError?.(error);
    },
  });
};

export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => channelApi.markAsRead(channelId),
    onMutate: async (channelId: string) => {
      queryClient.setQueryData<ChannelSummary[]>(channelKeys.lists(), (old = []) =>
        old.map((ch) =>
          ch.id === channelId ? { ...ch, unreadCount: 0, hasUnread: false } : ch
        )
      );
    },
    onError: (err) => {
      console.warn('[Channel] Failed to mark as read in DB:', err);
    },
  });
};
