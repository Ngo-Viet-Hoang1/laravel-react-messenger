export interface ChatClientEvents {
  ReceiveMessage: (message: unknown) => void;
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
