import ChannelItem from '@/Components/App/ChannelItem';
import TextInput from '@/Components/Breeze/TextInput';
import {
    ChannelModalProvider,
    useChannelModal,
} from '@/Contexts/ChannelModalContext';
import { useEventBus } from '@/EventBus';
import useChannels from '@/hooks/useChannels';
import useChannelSockets from '@/hooks/useChannelSockets';
import useOnlinePresence from '@/hooks/useOnlinePresence';
import { ChatItem, ChatPageProps } from '@/types';
import { ChannelReadUpdatedEvent } from '@/types/events';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';

const EMPTY_CHANNELS: ChatItem[] = [];

const ChatLayoutInner = ({ children }: { children: ReactNode }) => {
    const { props: pageProps } = usePage<ChatPageProps>();
    const currentUser = pageProps.auth.user;
    const channels = pageProps.channels ?? EMPTY_CHANNELS;
    const selectedChannel = pageProps.selectedChannel ?? null;

    const { on, emit } = useEventBus();
    const { openModal } = useChannelModal();
    const [search, setSearch] = useState('');

    const {
        sortedChannels,
        updateLastMessage,
        updateAfterMessageDeleted,
        markChannelAsRead,
        removeChannel,
    } = useChannels(channels, search, selectedChannel?.id ?? null, Number(currentUser.id));

    const { isOnline } = useOnlinePresence();

    useChannelSockets(channels, Number(currentUser.id));

    const handleChannelSelect = (channelId: number): void => {
        router.visit(route('channels.show', channelId), {
            only: ['selectedChannel', 'messages'],
            preserveScroll: false,
        });
    };

    useEffect(() => {
        const offCreated = on('message.created', updateLastMessage);
        const offDeleted = on('message.deleted', updateAfterMessageDeleted);
        const offReadUpdated = on(
            'channel.read.updated',
            ({ channel_id, last_read_message_id }: ChannelReadUpdatedEvent) => {
                markChannelAsRead(channel_id, last_read_message_id);
            },
        );
        return () => {
            offCreated();
            offDeleted();
            offReadUpdated();
        };
    }, [on, updateLastMessage, updateAfterMessageDeleted, markChannelAsRead]);

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

    useEffect(() => {
        if (!selectedChannel) return;

        const markAsRead = async (): Promise<void> => {
            try {
                const { data } = await axios.post(
                    route('channels.read', selectedChannel.id),
                );

                markChannelAsRead(
                    data.channel_id,
                    data.last_read_message_id ?? null,
                );
            } catch {
                // Ignore read-state sync failures; the UI will recover on next refresh.
            }
        };

        void markAsRead();
    }, [selectedChannel?.id, markChannelAsRead]);

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
                        onChange={(e) =>
                            setSearch(e.target.value.toLowerCase())
                        }
                        placeholder="Filter users and groups"
                        className="w-full"
                    />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {sortedChannels.map((c) => (
                        <ChannelItem
                            key={c.id}
                            channel={c}
                            online={
                                c.type === 'direct' && c.peer_user_id != null
                                    ? isOnline(c.peer_user_id)
                                    : false
                            }
                            isSelected={selectedChannel?.id === c.id}
                            canManage={currentUser.is_admin}
                            onSelect={handleChannelSelect}
                        />
                    ))}
                </div>
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
