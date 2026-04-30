import TextInput from '@/Components/TextInput';
import { PencilSquareIcon } from '@heroicons/react/16/solid';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ConversationItem from '../Components/App/ConversationItem';

const ChatLayout = ({ children }) => {
    const page = usePage();
    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [localConversations, setLocalConversations] = useState(conversations);
    const [sortedConversations, setSortedConversations] = useState([]);
    const isUserOnline = (userId) => !!onlineUsers[userId];

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) => {
                return conversation.name.toLowerCase().includes(search);
            }),
        );
    };

    useEffect(() => {
        setSortedConversations(
            [...localConversations].sort((a, b) => {
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
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        if (!window.Echo) {
            console.error('Echo is not initialized');
            return;
        }

        window.Echo.join('online')
            .here((users) => {
                const onlineUserObj = Object.fromEntries(
                    users.map((user) => [user.id, user]),
                );

                setOnlineUsers((prevOnlineUsers) => {
                    return { ...prevOnlineUsers, ...onlineUserObj };
                });
            })
            .joining((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updatedUsers = { ...prevOnlineUsers };
                    updatedUsers[user.id] = user;
                    return updatedUsers;
                });
            })
            .leaving((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updatedUsers = { ...prevOnlineUsers };
                    delete updatedUsers[user.id];
                    return updatedUsers;
                });
            })
            .error((error) => {
                console.error('Echo error', error);
            });

        return () => {
            window.Echo?.leave('online');
        };
    }, []);

    return (
        <>
            <div className="flex w-full flex-1 overflow-hidden">
                <div
                    className={`flex w-full flex-col overflow-hidden bg-slate-800 transition-all sm:w-[220px] md:w-[300px] ${
                        selectedConversation ? '-ml-[100%] sm:ml-0' : ''
                    }`}
                >
                    <div className="justify-betwwen flex items-center px-3 py-2 text-xl font-medium">
                        My Conversation
                        <div
                            className="tolltip tolltip-left"
                            data-tip="Create New Group"
                        >
                            <button className="text-gray-400 hover:text-gray-200">
                                <PencilSquareIcon className="ml-2 inline-block h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="p-3">
                        <TextInput
                            onKeyUp={onSearch}
                            placeholder="Filter users and groups"
                            className="w-full"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {sortedConversations &&
                            sortedConversations.map((conversation) => (
                                <ConversationItem
                                    key={`${
                                        conversation.is_group
                                            ? 'group_'
                                            : 'user_'
                                    }${conversation.id}`}
                                    conversation={conversation}
                                    online={!!isUserOnline(conversation.id)}
                                    selectedConversation={selectedConversation}
                                />
                            ))}
                    </div>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    {children}
                </div>
            </div>
        </>
    );
};

export default ChatLayout;
