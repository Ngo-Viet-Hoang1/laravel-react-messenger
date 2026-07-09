import * as React from 'react';
import { toast } from 'sonner';
import type { ChatMessage } from '@/entities/message';
import { useMarkAsReadMutation } from '@/entities/channel';

export interface UseChatScrollProps {
  messages: ChatMessage[];
  channelId?: string;
  currentUserId?: string;
  hasPreviousPage?: boolean;
  isFetchingPreviousPage?: boolean;
  fetchPreviousPage: () => Promise<unknown>;
  isMessagesLoading?: boolean;
}

export interface UseChatScrollReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
  unreadBelowCount: number;
  highlightedMessageId: string | null;
}

const AT_BOTTOM_THRESHOLD_PX = 45;
const FETCH_OLDER_THRESHOLD_PX = 80;

export const useChatScroll = ({
  messages,
  channelId,
  currentUserId,
  hasPreviousPage,
  isFetchingPreviousPage,
  fetchPreviousPage,
  isMessagesLoading,
}: UseChatScrollProps): UseChatScrollReturn => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const isInitialLoadRef = React.useRef(true);
  const isAtBottomRef = React.useRef(true);
  const scrollHeightBeforeUpdateRef = React.useRef<number | null>(null);
  const scrollTopBeforeUpdateRef = React.useRef<number | null>(null);

  // Track specific boundary message IDs instead of array length to distinguish top prepend from bottom append
  const prevFirstMessageIdRef = React.useRef<string | null>(null);
  const prevLastMessageIdRef = React.useRef<string | null>(null);

  const [unreadBelowCount, setUnreadBelowCount] = React.useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const highlightTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: markChannelAsRead } = useMarkAsReadMutation();

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Reset state and mark as read when channel switches
  React.useEffect(() => {
    isInitialLoadRef.current = true;
    isAtBottomRef.current = true;
    setUnreadBelowCount(0);
    prevFirstMessageIdRef.current = null;
    prevLastMessageIdRef.current = null;
    scrollHeightBeforeUpdateRef.current = null;
    scrollTopBeforeUpdateRef.current = null;

    if (channelId) {
      markChannelAsRead(channelId);
    }
  }, [channelId, markChannelAsRead]);

  // Initial scroll to bottom on first load of the channel
  React.useLayoutEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoadRef.current = false;
      isAtBottomRef.current = true;
      prevFirstMessageIdRef.current = messages[0]?.id || messages[0]?.clientMessageId || null;
      prevLastMessageIdRef.current =
        messages[messages.length - 1]?.id || messages[messages.length - 1]?.clientMessageId || null;

      if (channelId) {
        markChannelAsRead(channelId);
      }
    }
  }, [isMessagesLoading, messages, channelId, markChannelAsRead]);

  // Synchronous scroll restoration on older messages prepend (runs BEFORE paint -> 0px jump/flicker)
  React.useLayoutEffect(() => {
    if (scrollHeightBeforeUpdateRef.current !== null && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const heightDiff = container.scrollHeight - scrollHeightBeforeUpdateRef.current;
      if (heightDiff > 0) {
        container.scrollTop = (scrollTopBeforeUpdateRef.current ?? 0) + heightDiff;
      }
      scrollHeightBeforeUpdateRef.current = null;
      scrollTopBeforeUpdateRef.current = null;
    }
  }, [messages]);

  // Smart scroll behavior: ONLY trigger when a NEW message arrives at the bottom
  React.useEffect(() => {
    if (isInitialLoadRef.current || messages.length === 0) return;

    const currentFirstMessage = messages[0];
    const currentLastMessage = messages[messages.length - 1];
    const currentFirstId = currentFirstMessage?.id || currentFirstMessage?.clientMessageId || null;
    const currentLastId = currentLastMessage?.id || currentLastMessage?.clientMessageId || null;

    const prevFirstId = prevFirstMessageIdRef.current;
    const prevLastId = prevLastMessageIdRef.current;

    const isNewMessageAtBottom = Boolean(
      currentLastId && prevLastId && currentLastId !== prevLastId
    );
    const isOlderMessagesPrepended = Boolean(
      currentFirstId &&
      prevFirstId &&
      currentFirstId !== prevFirstId &&
      currentLastId === prevLastId
    );

    // Update boundary refs
    prevFirstMessageIdRef.current = currentFirstId;
    prevLastMessageIdRef.current = currentLastId;

    // If older messages were prepended at top, NEVER scroll to bottom!
    if (isOlderMessagesPrepended) {
      return;
    }

    // Only scroll if a NEW message was appended to the bottom of the list
    if (isNewMessageAtBottom) {
      const isSentByMe = Boolean(
        currentLastMessage && currentUserId === currentLastMessage.senderId
      );

      if (isSentByMe) {
        // Sent by current user -> always smooth scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        isAtBottomRef.current = true;
        setUnreadBelowCount(0);
      } else if (isAtBottomRef.current) {
        // Sent by others AND user is actively viewing the bottom -> smooth scroll and acknowledge read
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadBelowCount(0);
        if (channelId) {
          markChannelAsRead(channelId);
        }
      } else {
        // Sent by others AND user is scrolled up reading old messages -> do NOT pull down
        setUnreadBelowCount((prev) => prev + 1);
      }
    }
  }, [messages, currentUserId, channelId, markChannelAsRead]);

  // Scroll event listener
  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const atBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < AT_BOTTOM_THRESHOLD_PX;
      isAtBottomRef.current = atBottom;

      // If user manually scrolled back down to the bottom, clear unread badge and acknowledge read
      if (atBottom && unreadBelowCount > 0) {
        setUnreadBelowCount(0);
        if (channelId) {
          markChannelAsRead(channelId);
        }
      }

      // Trigger older messages fetch when scrolling near top
      if (
        target.scrollTop < FETCH_OLDER_THRESHOLD_PX &&
        hasPreviousPage &&
        !isFetchingPreviousPage
      ) {
        scrollHeightBeforeUpdateRef.current = target.scrollHeight;
        scrollTopBeforeUpdateRef.current = target.scrollTop;
        fetchPreviousPage();
      }
    },
    [
      hasPreviousPage,
      isFetchingPreviousPage,
      fetchPreviousPage,
      unreadBelowCount,
      channelId,
      markChannelAsRead,
    ]
  );

  // Explicit scroll to bottom (e.g. clicking the "New messages below" floating pill)
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    isAtBottomRef.current = true;
    setUnreadBelowCount(0);
    if (channelId) {
      markChannelAsRead(channelId);
    }
  }, [channelId, markChannelAsRead]);

  // Smooth scroll to a specific message (e.g. clicking search result or quoted reply banner)
  const scrollToMessage = React.useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1500);
      return;
    }

    toast.info('Message is in older history. Full text is visible in the panel.');
  }, []);

  return {
    scrollContainerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
    unreadBelowCount,
    highlightedMessageId,
  };
};
