import * as React from 'react';
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
  unreadBelowCount: number;
}

const AT_BOTTOM_THRESHOLD_PX = 35;
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
  const prevMessagesLengthRef = React.useRef(messages.length);

  const [unreadBelowCount, setUnreadBelowCount] = React.useState(0);
  const { mutate: markChannelAsRead } = useMarkAsReadMutation();

  // Reset state when channel switches
  React.useEffect(() => {
    isInitialLoadRef.current = true;
    isAtBottomRef.current = true;
    setUnreadBelowCount(0);
    prevMessagesLengthRef.current = 0;
  }, [channelId]);

  // Initial scroll to bottom on first load of the channel
  React.useLayoutEffect(() => {
    if (!isMessagesLoading && messages.length > 0 && isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoadRef.current = false;
      isAtBottomRef.current = true;
      if (channelId) {
        markChannelAsRead(channelId);
      }
    }
  }, [isMessagesLoading, messages.length, channelId, markChannelAsRead]);

  // Synchronous scroll restoration on older messages prepend (runs BEFORE paint -> 0px flicker)
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

  // Smart scroll behavior on new incoming message
  React.useEffect(() => {
    if (!isInitialLoadRef.current && messages.length > prevMessagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      const isSentByMe = Boolean(latestMessage && currentUserId === latestMessage.senderId);

      if (isSentByMe) {
        // Sent by current user -> always smooth scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        isAtBottomRef.current = true;
        setUnreadBelowCount(0);
      } else if (isAtBottomRef.current) {
        // Sent by others AND user is actively viewing bottom -> smooth scroll and mark as read
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadBelowCount(0);
        if (channelId) {
          markChannelAsRead(channelId);
        }
      } else {
        // Sent by others AND user is scrolled up reading old messages -> do NOT disturb reading position
        setUnreadBelowCount((prev) => prev + 1);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, messages, currentUserId, channelId, markChannelAsRead]);

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

  return {
    scrollContainerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    unreadBelowCount,
  };
};
