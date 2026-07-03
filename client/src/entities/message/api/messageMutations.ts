import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi } from './messageApi';
import { messageKeys, type MessagesInfiniteData, type MessagesPage } from './messageQueries';
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

      queryClient.setQueryData<MessagesInfiniteData>(messageKeys.byChannel(channelId), (old) => {
        if (!old || old.pages.length === 0) {
          return {
            pages: [{ items: [optimisticMessage], nextCursor: null, hasMore: false }],
            pageParams: [null],
          };
        }

        const lastIndex = old.pages.length - 1;
        const updatedPages = [...old.pages];
        updatedPages[lastIndex] = {
          ...updatedPages[lastIndex],
          items: [...updatedPages[lastIndex].items, optimisticMessage],
        };

        return { ...old, pages: updatedPages };
      });

      return { clientMsgId };
    },

    onError: (_err, _newPayload, context) => {
      if (!channelId || !context) return;

      queryClient.setQueryData<MessagesInfiniteData>(messageKeys.byChannel(channelId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: MessagesPage) => ({
            ...page,
            items: page.items.map((m) =>
              m.clientMessageId === context.clientMsgId
                ? { ...m, status: MESSAGE_STATUS.FAILED }
                : m
            ),
          })),
        };
      });
    },

    // Replace optimistic message with confirmed server message
    onSuccess: (savedMessage, _newPayload, context) => {
      if (!channelId || !context) return;

      queryClient.setQueryData<MessagesInfiniteData>(messageKeys.byChannel(channelId), (old) => {
        if (!old) return old;
        const confirmed: ChatMessage = { ...savedMessage, status: MESSAGE_STATUS.SENT };

        let replaced = false;
        const updatedPages = old.pages.map((page: MessagesPage) => {
          const index = page.items.findIndex(
            (m) =>
              (context.clientMsgId && m.clientMessageId === context.clientMsgId) ||
              m.id === context.clientMsgId
          );

          if (index !== -1) {
            replaced = true;
            const updatedItems = [...page.items];
            updatedItems[index] = confirmed;
            return { ...page, items: updatedItems };
          }
          return page;
        });

        if (replaced) {
          return { ...old, pages: updatedPages };
        }

        const lastIndex = updatedPages.length - 1;
        updatedPages[lastIndex] = {
          ...updatedPages[lastIndex],
          items: [...updatedPages[lastIndex].items, confirmed],
        };

        return { ...old, pages: updatedPages };
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
