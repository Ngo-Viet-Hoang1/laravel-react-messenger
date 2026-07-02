import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from './messageApi';
import { messageKeys } from './messageQueries';
import { channelKeys, type ChannelSummary } from '@/entities/channel';
import { MESSAGE_STATUS, type ChatMessage, type SendMessagePayload } from '../model/types';
import { selectCurrentUser } from '@/entities/user';
import { useAppSelector } from '@/app/store';

export const useSendMessageMutation = (channelId?: string) => {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector(selectCurrentUser);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => {
      if (!channelId) throw new Error('Channel ID is required');
      return messageApi.sendMessage(channelId, payload);
    },

    // Render optimistic message instantly
    onMutate: async (newPayload) => {
      if (!channelId) return;

      await queryClient.cancelQueries({ queryKey: messageKeys.byChannel(channelId) });

      const clientMsgId = newPayload.clientMessageId || crypto.randomUUID();
      const optimisticMessage: ChatMessage = {
        id: clientMsgId,
        channelId,
        senderId: currentUser?.id || '',
        senderUsername: currentUser?.username || 'You',
        senderAvatarUrl: currentUser?.avatarUrl || null,
        content: newPayload.content,
        clientMessageId: clientMsgId,
        createdAt: new Date().toISOString(),
        status: MESSAGE_STATUS.SENDING,
      };

      queryClient.setQueryData<ChatMessage[]>(messageKeys.byChannel(channelId), (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { clientMsgId };
    },

    onError: (_err, _newPayload, context) => {
      if (!channelId || !context) return;

      queryClient.setQueryData<ChatMessage[]>(messageKeys.byChannel(channelId), (old = []) =>
        old.map((m) =>
          m.clientMessageId === context.clientMsgId ? { ...m, status: MESSAGE_STATUS.FAILED } : m
        )
      );
    },

    // Replace optimistic message with confirmed server message
    onSuccess: (savedMessage, _newPayload, context) => {
      if (!channelId || !context) return;

      queryClient.setQueryData<ChatMessage[]>(messageKeys.byChannel(channelId), (old = []) => {
        const confirmed: ChatMessage = { ...savedMessage, status: MESSAGE_STATUS.SENT };
        const index = old.findIndex(
          (m) =>
            (context.clientMsgId && m.clientMessageId === context.clientMsgId) ||
            m.id === context.clientMsgId
        );

        if (index !== -1) {
          const updated = [...old];
          updated[index] = confirmed;
          return updated;
        }

        return [...old, confirmed];
      });

      // Update sidebar channels order/timestamp in-memory
      queryClient.setQueryData<ChannelSummary[]>(channelKeys.lists(), (old = []) =>
        old.map((ch) =>
          ch.id === channelId ? { ...ch, lastActivityAt: savedMessage.createdAt } : ch
        )
      );
    },
  });
};
