import ChannelItem from '@/Components/App/ChannelItem';
import UserSearchResults from '@/Components/App/UserSearchResults';
import TextInput from '@/Components/Breeze/TextInput';
import {
    ChannelModalProvider,
    useChannelModal,
} from '@/Contexts/ChannelModalContext';
import { useEventBus } from '@/EventBus';
import useChannels from '@/hooks/useChannels';
import useChannelSockets from '@/hooks/useChannelSockets';
import useOnlinePresence from '@/hooks/useOnlinePresence';
import useUserSearch from '@/hooks/useUserSearch';
import { ChatItem, ChatPageProps } from '@/types';
import { ChannelReadUpdatedEvent, MessageReactionUpdatedEvent } from '@/types/events';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { ReactNode, useCallback, useEffect, useState } from 'react';

const EMPTY_CHANNELS: ChatItem[] = [];

const ChatLayoutInner = ({ children }: { children: ReactNode }) => {
    const { props: pageProps } = usePage<ChatPageProps>();
    const currentUser = pageProps.auth.user;
    const channels = pageProps.channels ?? EMPTY_CHANNELS;
    const selectedChannel = pageProps.selectedChannel ?? null;

    const { on, emit } = useEventBus();
    const { openModal } = useChannelModal();
    const [search, setSearch] = useState('');

    const isSearching = search.trim().length > 0;

    const {
        sortedChannels,
        updateLastMessage,
        updateAfterMessageDeleted,
        markChannelAsRead,
        removeChannel,
        bumpChannelToTop,
    } = useChannels(channels, search.toLowerCase(), Number(currentUser.id));

    const { results: userSearchResults, isLoading: isSearchLoadingUsers } =
        useUserSearch(search, channels);

    const { isOnline } = useOnlinePresence();

    useChannelSockets(channels, Number(currentUser.id));

    const handleChannelSelect = (channelId: number): void => {
        setSearch('');
        router.visit(route('channels.show', channelId), {
            only: ['selectedChannel', 'messages'],
            preserveScroll: false,
        });
    };

    const handleSelectUser = useCallback((userId: number): void => {
        setSearch('');
        router.post(route('channels.direct', userId));
    }, []);

    const handleReadUpdated = ({
        channel_id,
        last_read_message_id,
    }: ChannelReadUpdatedEvent): void => {
        markChannelAsRead(channel_id, last_read_message_id);
    };

    useEffect(() => {
        const offCreated = on('message.created', updateLastMessage);
        const offDeleted = on('message.deleted', updateAfterMessageDeleted);
        const offReadUpdated = on('channel.read.updated', handleReadUpdated);
        const offReaction = on('message.reaction.updated', (event: MessageReactionUpdatedEvent) => {
            bumpChannelToTop(event.channel_id);
        });

        return () => {
            offCreated();
            offDeleted();
            offReadUpdated();
            offReaction();
        };
    }, [
        on,
        updateLastMessage,
        updateAfterMessageDeleted,
        handleReadUpdated,
        bumpChannelToTop,
    ]);

    useEffect(() => {
        const offDeleted = on('channel.deleted', ({ id, name }) => {
            removeChannel(id);
            emit('toast.show', `The channel "${name}" has been deleted`);
            if (selectedChannel?.id === id) {
                router.visit(route('dashboard'));
            }
        });
        return offDeleted;
    }, [on, emit, selectedChannel?.id, removeChannel]);

    return (
        <div className="flex h-full min-h-0 w-full overflow-hidden">
            {/* Sidebar */}
            <div
                className={`min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800 sm:flex sm:w-[280px] md:w-[320px] ${selectedChannel ? 'hidden sm:flex' : 'flex'}`}
            >
                <div className="flex items-center justify-between px-3 py-2 text-lg font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                    My channels
                    <div
                        className="tooltip tooltip-left"
                        data-tip="Create new Group"
                    >
                        <button
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                            onClick={() => openModal()}
                        >
                            <PencilSquareIcon className="w-5" />
                        </button>
                    </div>
                </div>

                <div className="shrink-0 p-3 dark:border-slate-700">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setSearch('');
                            }
                        }}
                        placeholder="Search users or filter channels"
                        className="w-full"
                    />
                </div>

                {/* Search mode: show inline results */}
                {isSearching ? (
                    <UserSearchResults
                        channels={sortedChannels}
                        users={userSearchResults}
                        isLoading={isSearchLoadingUsers}
                        onSelectChannel={handleChannelSelect}
                        onSelectUser={handleSelectUser}
                    />
                ) : (
                    /* Normal mode: show full channel list */
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {sortedChannels.map((c) => (
                            <ChannelItem
                                key={c.id}
                                channel={c}
                                online={
                                    c.type === 'direct' &&
                                    c.peer_user_id != null
                                        ? isOnline(c.peer_user_id)
                                        : false
                                }
                                isSelected={selectedChannel?.id === c.id}
                                canManage={currentUser.is_admin}
                                onSelect={handleChannelSelect}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content area */}
            <div
                className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-white dark:bg-slate-800 xs:m-2 xs:shadow-sm ${selectedChannel ? 'flex' : 'hidden sm:flex'}`}
            >
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            </div>
        </div>
    );
};

const ChatLayout = ({ children }: { children: ReactNode }) => (
    <ChannelModalProvider>
        <ChatLayoutInner>{children}</ChatLayoutInner>
    </ChannelModalProvider>
);

export default ChatLayout;
