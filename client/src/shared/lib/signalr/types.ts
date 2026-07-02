import type { components } from '@/shared/api';

export type SignalRMessageDto = components['schemas']['MessageDto'];

export interface ChatClientEvents {
  ReceiveMessage: (message: SignalRMessageDto) => void;
  UserConnected: (userId: string) => void;
  UserDisconnected: (userId: string) => void;
  OnlineUsers: (userIds: string[]) => void;
  UserTyping: (channelId: string, userId: string, username: string) => void;
  UserStoppedTyping: (channelId: string, userId: string) => void;
  MessageReactionUpdated: (
    messageId: string,
    channelId: string,
    emoji: string,
    count: number,
    userId: string
  ) => void;
  HubError: (code: string, message: string) => void;
}
