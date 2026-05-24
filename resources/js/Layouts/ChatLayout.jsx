import ConversationItem from '@/Components/App/ConversationItem';
import TextInput from '@/Components/TextInput';
import { useEventBus } from '@/EventBus';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import GroupModal from '../Components/App/GroupModal';
import echo from '../echo';

const ChatLayout = ({ children }) => {
    const page = usePage();
    const pageConversations = page.props.conversations;
    const conversations = useMemo(
        () => pageConversations ?? [],
        [pageConversations],
    );
    const selectedConversation = page.props.selectedConversation ?? null;
    const [localConversation, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const { on, emit } = useEventBus();

    const isUSerOnline = (userId) => onlineUsers[userId];

    const onSearch = (e) => {
        const search = e.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) => {
                return conversation.name.toLowerCase().includes(search);
            }),
        );
    };
    const messageCreated = useCallback((message) => {
        setLocalConversations((oldUsers) => {
            return oldUsers.map((u) => {
                if (
                    message.receiver_id &&
                    !u.is_group &&
                    (u.id == message.sender_id || u.id == message.receiver_id)
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }
                if (
                    message.group_id &&
                    u.is_group &&
                    u.id == message.group_id
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }
                return u;
            });
        });
    }, []);
    const upsertGroupConversation = useCallback((group) => {
        setLocalConversations((oldConversations) => {
            const exists = oldConversations.some(
                (conversation) =>
                    conversation.is_group && conversation.id === group.id,
            );

            if (exists) {
                return oldConversations.map((conversation) => {
                    if (conversation.is_group && conversation.id === group.id) {
                        return {
                            ...conversation,
                            ...group,
                        };
                    }

                    return conversation;
                });
            }

            return [...oldConversations, group];
        });
    }, []);
    const messageDeleted = useCallback(
        (prevMessage) => {
            if (!prevMessage) {
                return;
            }

            messageCreated(prevMessage);
        },
        [messageCreated],
    );
    useEffect(() => {
        const offCreate = on('message.created', messageCreated);
        const offDelete = on('message.deleted', messageDeleted);
        const offGroupCreated = on('group.created', upsertGroupConversation);
        const offGroupUpdated = on('group.updated', upsertGroupConversation);
        const offUserUpdated = on('user.updated', (user) => {
            setLocalConversations((oldConversations) => {
                return oldConversations.map((conversation) => {
                    if (conversation.is_user && conversation.id === user.id) {
                        return {
                            ...conversation,
                            ...user,
                        };
                    }

                    return conversation;
                });
            });
        });
        const offShowModal = on('GroupModal.show', () => {
            setShowGroupModal(true);
        });

        const offGroupDeleted = on('group.deleted', ({ id, name }) => {
            setLocalConversations((oldConversations) => {
                return oldConversations.filter((con) => con.id !== id);
            });

            emit('toast.show', `Group ${name} was deleted`);

            if (
                !selectedConversation ||
                (selectedConversation &&
                    selectedConversation.is_group &&
                    selectedConversation.id === id)
            ) {
                router.visit(route('dashboard'));
            }
        });
        return () => {
            offCreate();
            offDelete();
            offGroupCreated();
            offGroupUpdated();
            offUserUpdated();
            offShowModal();
            offGroupDeleted();
        };
    }, [
        emit,
        messageCreated,
        messageDeleted,
        on,
        selectedConversation,
        upsertGroupConversation,
    ]);
    useEffect(() => {
        setSortedConversations(
            [...localConversation].sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? -1 : 1;
                } else if (a.blocked_at) {
                    return 1;
                } else if (b.blocked_at) {
                    return -1;
                }
                if (a.last_message && b.last_message) {
                    return b.last_message_date.localeCompare(
                        a.last_message_date,
                    );
                } else if (a.last_message) {
                    return -1;
                } else if (b.last_message) {
                    return 1;
                } else {
                    return 0;
                }
            }),
        );
    }, [localConversation]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        echo.join('online')
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user]),
                );
                setOnlineUsers((prevOnlineUsers) => ({
                    ...prevOnlineUsers,
                    ...onlineUsersObj,
                }));
            })
            .joining((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updateUsers = { ...prevOnlineUsers };
                    updateUsers[user.id] = user;
                    return updateUsers;
                });
            })
            .leaving((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updateUsers = { ...prevOnlineUsers };
                    delete updateUsers[user.id];
                    return updateUsers;
                });
            })
            .error((error) => {
                console.error('error', error);
            });
        return () => {
            echo.leave('online');
        };
    }, []);

    return (
        <>
            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
                <div
                    className={`${selectedConversation ? '-ml-[100%] sm:ml-0' : ''} flex min-h-0 w-full flex-col overflow-hidden bg-slate-800 transition-all sm:flex sm:w-[220px] md:w-[300px]`}
                >
                    <div className="text-x1 flex items-center justify-between px-3 py-2 font-medium text-gray-200">
                        My Conversations
                        <div
                            className="tool-left tooltip"
                            data-tip="Create New Group"
                        >
                            <button
                                onClick={() => setShowGroupModal(true)}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                <PencilSquareIcon className="m1-2 inline-block h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="p-3">
                        <TextInput
                            onKeyUp={onSearch}
                            placeholder="Filter user or group"
                            className="w-full rounded-md border-0 bg-slate-700 px-2 py-1 text-sm text-gray-300 focus:ring-1 focus:ring-inset focus:ring-slate-400"
                        />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {sortedConversations &&
                            sortedConversations.map((conversation) => (
                                <ConversationItem
                                    key={`${conversation.is_group ? 'group' : 'user'}-${conversation.id}`}
                                    conversation={conversation}
                                    online={!!isUSerOnline(conversation.id)}
                                    selectedConversation={selectedConversation}
                                />
                            ))}
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {children}
                </div>
            </div>
            <GroupModal
                show={showGroupModal}
                onClose={() => setShowGroupModal(false)}
            />
        </>
    );
};

export default ChatLayout;
