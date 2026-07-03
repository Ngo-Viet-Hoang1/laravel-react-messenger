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

export interface UseAddChannelMembersMutationOptions {
  onSuccess?: (addedCount: number) => void;
  onError?: (error: unknown) => void;
}

export const useAddChannelMembersMutation = (
  channelId: string,
  options?: UseAddChannelMembersMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds: string[]) => channelApi.addChannelMembers(channelId, memberIds),
    onSuccess: (addedCount) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      toast.success(
        addedCount === 1 ? '1 member added successfully!' : `${addedCount} members added successfully!`
      );
      options?.onSuccess?.(addedCount);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export interface UseUpdateChannelMutationOptions {
  onSuccess?: (channel: ChannelDetail) => void;
  onError?: (error: unknown) => void;
}

export const useUpdateChannelMutation = (
  channelId: string,
  options?: UseUpdateChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string | null; avatarUrl?: string | null }) =>
      channelApi.updateChannel(channelId, payload),
    onSuccess: (updatedChannel) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      toast.success('Channel details updated successfully!');
      options?.onSuccess?.(updatedChannel);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export interface UseRemoveChannelMemberMutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useRemoveChannelMemberMutation = (
  channelId: string,
  options?: UseRemoveChannelMemberMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => channelApi.removeChannelMember(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      toast.success('Member removed from channel.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export interface UseLeaveChannelMutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useLeaveChannelMutation = (
  channelId: string,
  options?: UseLeaveChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => channelApi.leaveChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      queryClient.removeQueries({ queryKey: channelKeys.detail(channelId) });
      toast.success('You have left the channel.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export interface UseDeleteChannelMutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useDeleteChannelMutation = (
  channelId: string,
  options?: UseDeleteChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => channelApi.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
      queryClient.removeQueries({ queryKey: channelKeys.detail(channelId) });
      toast.success('Channel deleted successfully.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

