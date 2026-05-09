import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import TextInput from '@/Components/TextInput';
import ConversationItem from '@/Components/App/ConversationItem';
import GroupModal from '@/Components/App/GroupModal';
import { useEventBus } from '@/EventBus';

const ChatLayout = ({ children }) => {
    const page = usePage();
    const conversations = page.props.conversation;
    const selectedConversation = page.props.selectedConversation;
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const { on, emit } = useEventBus();
    const recentGroupDeletesRef = useRef(new Set());
    const deletedGroupIdsRef = useRef(new Set());

    const isUserOnline = (userId) => onlineUsers[userId];

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) => {
                return (
                    conversation.name.toLowerCase().includes(search)
                )
            })
        );
    }

    const messageCreated = (message) => {
        setLocalConversations((oldUser) => {
            return oldUser.map((u) => {
                const conversationId = Number(u.id);
                const receiverId = Number(message.receiver_id);
                const senderId = Number(message.sender_id);
                const groupId = Number(message.group_id);

                // is user
                if (message.receiver_id
                    && !u.is_group
                    && (conversationId === receiverId || conversationId === senderId)
                ) {
                    return {
                        ...u,
                        last_message: message.message,
                        last_message_date: message.created_at,
                    };
                }
                // is group
                if (message.group_id
                    && u.is_group
                    && conversationId === groupId
                ) {
                    return {
                        ...u,
                        last_message: message.message,
                        last_message_date: message.created_at,
                    };
                }

                return u;
            });
        })
    }

    const messageDeleted = (payload) => {
        const prevMessage = payload?.prevMessage;

        if (!prevMessage) {
            return;
        }

        messageCreated(prevMessage);
    }

    useEffect(() => {
        const offCreated = on('message.created', messageCreated);
        const offDeleted = on('message.deleted', messageDeleted);
        const offShowModal = on('GroupModal.show', (group) => { setShowGroupModal(true) });

        const offGroupDeleted = on('group.deleted', ({ id, name }) => {
            const groupId = Number(id);

            if (recentGroupDeletesRef.current.has(groupId)) {
                return;
            }

            recentGroupDeletesRef.current.add(groupId);
            setTimeout(() => {
                recentGroupDeletesRef.current.delete(groupId);
            }, 15000);

            deletedGroupIdsRef.current.add(groupId);

            setLocalConversations((oldConversations) => {
                return oldConversations.filter((con) => Number(con.id) !== groupId);
            });

            emit('toast.show', `Group ${name} was deleted`);

            if (!selectedConversation ||
                (selectedConversation.is_group &&
                Number(selectedConversation.id) === groupId)
            ) {
                router.visit(route("dashboard"));
            }
        });
        return () => {
            offCreated();
            offDeleted();
            offShowModal();
            offGroupDeleted();
        };
    }, [emit, on, selectedConversation]);

useEffect(() => {
    const uniqueConversations = Array.from(
        new Map(
            localConversations.map((conversation) => [
                `${conversation.is_group ? 'group_' : 'user_'}${conversation.id}`,
                conversation,
            ])
        ).values()
    );

    setSortedConversations(
        uniqueConversations.sort((a, b) => {
            if (a.blocked_at && b.blocked_at) {
                return a.blocked_at > b.blocked_at ? 1 : -1;
            } else if (a.blocked_at) {
                return 1;
            } else if (b.blocked_at) {
                return -1;
            }
            if (a.last_message_date && b.last_message_date) {
                return b.last_message_date.localeCompare(a.last_message_date);
            } else if (a.last_message_date) {
                return -1;
            } else if (b.last_message_date) {
                return 1;
            } else {
                return 0;
            }
        })
    );
}, [localConversations]);

useEffect(() => {
    const deletedGroupIds = deletedGroupIdsRef.current;

    setLocalConversations(
        conversations.filter((conversation) => {
            if (!conversation.is_group) {
                return true;
            }

            return !deletedGroupIds.has(Number(conversation.id));
        })
    );
}, [conversations]);

useEffect(() => {
    const echo = window.Echo;

    if (!echo || typeof echo.join !== 'function') {
        return undefined;
    }

    echo.join('online')
        .here((users) => {
            const onlineUserObject = Object.fromEntries(users.map((user) => [user.id, user]));
            setOnlineUsers((prevOnlineUsers) => {
                return { ...prevOnlineUsers, ...onlineUserObject };
            });
        })
        .joining((user) => {
            console.log('joining', user);
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
            console.log('error', error);
        });

    return () => {
        echo.leave('online');
    };
}, []);

return (
    <>
        <div className='flex-1 w-full flex overflow-hidden'>
            <div className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-slate-800 
                     flex flex-col overflow-hidden ${selectedConversation ? "ml-[100] sm:ml-0" : ""
                }`}>

                <div className='flex items-center justify-between py-2 px-3 text-xl font-medium text-gray-200'>
                    My conversations
                    <div className='tooltip tooltip-left' data-tip="Create new Group">
                        <button onClick={ev => setShowGroupModal(true)} className='text-gray-400 hover:text-gray-200'>
                            <PencilSquareIcon className='w-4 h-4 inline-block ml-2' />
                        </button>
                    </div>
                </div>

                <div className='p-3'>
                    <TextInput onKeyUp={onSearch} placeholder='Filter users and groups' className='w-full' />
                </div>
                <div className='flex-1 overflow-auto'>
                    {sortedConversations && sortedConversations.map((conversation) => (
                        <ConversationItem
                            key={`${conversation.is_group ? 'group_' : 'user_'
                                }${conversation.id}`}
                            conversation={conversation}
                            online={!!isUserOnline(conversation.id)}
                            selectedConversation={selectedConversation}
                        />
                    ))}
                </div>

            </div>
            <div className='flex-1 flex flex-col overflow-hidden'>
                {children}
            </div>
        </div>
        <GroupModal show={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </>
);
};

export default ChatLayout;