import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { channelApi } from './channelApi';
import { channelKeys } from './channelQueries';
import type {
  ChannelDetail,
  ChannelMemberRole,
  ChannelSummary,
  CreateChannelPayload,
} from '../model/types';
import type { MutationCallbacks } from '@/shared/api';

export type UseCreateChannelMutationOptions = MutationCallbacks<ChannelDetail>;

export const useCreateChannelMutation = (options?: UseCreateChannelMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => channelApi.createChannel(payload),
    meta: {
      errorMessage: 'Failed to create channel.',
    },
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

export type UseStartDirectChatMutationOptions = MutationCallbacks<ChannelDetail>;

export const useStartDirectChatMutation = (options?: UseStartDirectChatMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => channelApi.getOrCreateDirectChannel(targetUserId),
    meta: {
      errorMessage: 'Failed to start direct conversation.',
    },
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
  const lastMarkedChannelIdRef = React.useRef<string | null>(null);

  return useMutation({
    mutationFn: (channelId: string) => {
      // Guard: Check if the channel actually has unread messages before triggering HTTP POST
      const channels = queryClient.getQueryData<ChannelSummary[]>(channelKeys.lists());
      const channel = channels?.find((c) => c.id === channelId);
      const hasUnread = channel && (Number(channel.unreadCount ?? 0) > 0 || Boolean(channel.hasUnread));

      // Skip redundant network call if channel has 0 unread messages AND was already marked
      if (!hasUnread && lastMarkedChannelIdRef.current === channelId) {
        return Promise.resolve();
      }

      lastMarkedChannelIdRef.current = channelId;
      return channelApi.markAsRead(channelId);
    },
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

export type UseAddChannelMembersMutationOptions = MutationCallbacks<number>;

export const useAddChannelMembersMutation = (
  channelId: string,
  options?: UseAddChannelMembersMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds: string[]) => channelApi.addChannelMembers(channelId, memberIds),
    meta: {
      errorMessage: 'Failed to add members to channel.',
    },
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

export type UseUpdateChannelMutationOptions = MutationCallbacks<ChannelDetail>;

export const useUpdateChannelMutation = (
  channelId: string,
  options?: UseUpdateChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string | null; avatarUrl?: string | null }) =>
      channelApi.updateChannel(channelId, payload),
    meta: {
      errorMessage: 'Failed to update channel details.',
    },
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

export type UseUpdateChannelMemberRoleMutationOptions = MutationCallbacks;

export const useUpdateChannelMemberRoleMutation = (
  channelId: string,
  options?: UseUpdateChannelMemberRoleMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ChannelMemberRole }) =>
      channelApi.updateChannelMemberRole(channelId, userId, role),
    meta: {
      errorMessage: 'Failed to update member role.',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(channelId) });
      toast.success('Member role updated successfully!');
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export type UseTransferChannelOwnershipMutationOptions = MutationCallbacks;

export const useTransferChannelOwnershipMutation = (
  channelId: string,
  options?: UseTransferChannelOwnershipMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: string) => channelApi.transferOwnership(channelId, newOwnerId),
    meta: {
      errorMessage: 'Failed to transfer channel ownership.',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.members(channelId) });
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
      toast.success('Channel ownership transferred successfully!');
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};

export type UseRemoveChannelMemberMutationOptions = MutationCallbacks;

export const useRemoveChannelMemberMutation = (
  channelId: string,
  options?: UseRemoveChannelMemberMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => channelApi.removeChannelMember(channelId, userId),
    meta: {
      errorMessage: 'Failed to remove member.',
    },
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

export type UseLeaveChannelMutationOptions = MutationCallbacks;

export const useLeaveChannelMutation = (
  channelId: string,
  options?: UseLeaveChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => channelApi.leaveChannel(channelId),
    meta: {
      errorMessage: 'Failed to leave channel.',
    },
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

export type UseDeleteChannelMutationOptions = MutationCallbacks;

export const useDeleteChannelMutation = (
  channelId: string,
  options?: UseDeleteChannelMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => channelApi.deleteChannel(channelId),
    meta: {
      errorMessage: 'Failed to delete channel.',
    },
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
