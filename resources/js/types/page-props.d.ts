import type { User } from './auth';
import type { ChatItem } from './chat';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    conversations?: ChatItem[];
    selectedConversation?: ChatItem | null;
};
