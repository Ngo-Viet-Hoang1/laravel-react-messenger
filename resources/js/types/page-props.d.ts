import type { User } from './auth';
import type { ChatItem } from './chat';

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: { user: User };
};

export type ChatPageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = PageProps<T> & {
    channels?: ChatItem[];
    selectedChannel?: ChatItem | null;
};
