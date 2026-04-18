import ConversationItem from '@/Components/App/ConversationItem';
import TextInput from '@/Components/Breeze/TextInput';
import { ChatItem, PageProps, User } from '@/types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

const EMPTY_CONVERSATIONS: ChatItem[] = [];
const getTime = (date?: string | null) => (date ? new Date(date).getTime() : 0);

const ChatLayout = ({ children }: { children: ReactNode }) => {
    const pageProps = usePage<PageProps>().props;
    const conversations = pageProps.conversations ?? EMPTY_CONVERSATIONS;
    const selectedConversation = pageProps.selectedConversation ?? null;

    const [onlineUsers, setOnlineUsers] = useState<Record<number, User>>({});
    const [localConversations, setLocalConversations] = useState<ChatItem[]>(
        [],
    );

    const sortedConversations = useMemo(() => {
        return [...localConversations].sort((a, b) => {
            const aBlocked = getTime(a.blocked_at);
            const bBlocked = getTime(b.blocked_at);

            if (!!aBlocked !== !!bBlocked) return aBlocked ? 1 : -1;
            if (aBlocked && bBlocked) return bBlocked - aBlocked;

            const aLast = getTime(a.last_message_date);
            const bLast = getTime(b.last_message_date);

            if (aLast && bLast) return bLast - aLast;
            if (aLast) return -1;
            if (bLast) return 1;

            return 0;
        });
    }, [localConversations]);

    const isUserOnline = (userId: number) => userId in onlineUsers;

    const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value.toLowerCase();
        if (!value) {
            setLocalConversations(conversations);
            return;
        }

        setLocalConversations(
            conversations.filter((conversation) =>
                conversation.name.toLowerCase().includes(value),
            ),
        );
    };

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        const e = echo();
        if (!e) return;
        e.join('online')
            .here((users: User[]) => {
                const onlineUsers = Object.fromEntries(
                    users.map((user) => [user.id, user]),
                );
                setOnlineUsers(onlineUsers);
            })
            .joining((user: User) => {
                setOnlineUsers((prev) => ({ ...prev, [user.id]: user }));
            })
            .leaving((user: User) => {
                setOnlineUsers((prev) => {
                    const newOnlineUsers = { ...prev };
                    delete newOnlineUsers[user.id];
                    return newOnlineUsers;
                });
            })
            .error((error: Error) => console.log('error', error));

        return () => e.leave('online');
    }, []);

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden">
            <div
                className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 transition-all dark:border-slate-700 dark:bg-slate-800 sm:w-[280px] md:w-[320px] ${selectedConversation ? '-ml-full sm:ml-0' : ''}`}
            >
                <div className="flex items-center justify-between px-3 py-2 text-lg font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    My conversations
                    <div
                        className="tooltip tooltip-left"
                        data-tip="Create new Group"
                    >
                        <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100">
                            <PencilSquareIcon className="w-5" />
                        </button>
                    </div>
                </div>

                <div className="shrink-0 p-3 dark:border-slate-700">
                    <TextInput
                        onKeyUp={onSearch}
                        placeholder="Filter users and groups"
                        className="w-full"
                    />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {sortedConversations.map((conversation) => (
                        <ConversationItem
                            key={`${conversation.is_group ? 'group' : 'user'}_${conversation.id}`}
                            conversation={conversation}
                            online={
                                conversation.is_user
                                    ? isUserOnline(conversation.id)
                                    : false
                            }
                            selectedConversation={selectedConversation}
                        />
                    ))}
                </div>
            </div>

            <div
                className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${selectedConversation ? 'flex' : 'hidden sm:flex'}`}
            >
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            </div>
        </div>
    );
};

export default ChatLayout;
