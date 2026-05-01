import {
    FaceSmileIcon,
    HandThumbUpIcon,
    PaperAirplaneIcon,
    PaperClipIcon,
    PhotoIcon,
} from '@heroicons/react/24/solid';
import { useState } from 'react';
import NewMessageInput from './NewMessageInput';

const MessageInput = ({ conversation = null, onMessageSent = null }) => {
    const [newMessage, setNewMessage] = useState('');
    const [inputErrorMessage, setInputErrorMessage] = useState('');
    const [messageSending, setMessageSending] = useState(false);

    const onSendClick = () => {
        if (newMessage.trim() === '') {
            setInputErrorMessage('Hay nhap mot tin nhan');

            setTimeout(() => {
                setInputErrorMessage('');
            }, 3000);
            return;
        }
        const formData = new FormData();
        formData.append('message', newMessage);
        if (conversation.is_user) {
            formData.append('receiver_id', conversation.id);
        } else if (conversation.is_group) {
            formData.append('group_id', conversation.id);
        }

        setMessageSending(true);
        axios
            .post(route('message.store'), formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    console.log('Upload progress:', progress);
                },
            })
            .then((response) => {
                if (onMessageSent) {
                    onMessageSent(response.data);
                }
                setNewMessage('');
                setMessageSending(false);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
                setMessageSending(false);
            });
    };

    return (
        <div className="flex flex-wrap items-start border-t border-slate-700 py-3">
            <div className="xs:flex-none xs:order-1 order-2 p-2">
                <button className="relative p-1 text-gray-400 hover:text-gray-300">
                    <PaperClipIcon className="w-5" />
                    <input
                        type="file"
                        multiple
                        className="absolute bottom-0 left-0 right-0 top-0 z-20 cursor-pointer opacity-0"
                    />
                </button>
                <button className="relative p-1 text-gray-400 hover:text-gray-300">
                    <PhotoIcon className="w-6" />
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute bottom-0 left-0 right-0 top-0 z-20 cursor-pointer opacity-0"
                    />
                </button>
            </div>
            <div className="xs:p-0 xs:basis-0 xs:order-2 relative order-1 min-w-[220px] flex-1 basis-full px-3">
                <div className="flex">
                    <NewMessageInput
                        value={newMessage}
                        onSend={onSendClick}
                        onChange={(ev) => setNewMessage(ev.target.value)}
                    />
                    <button
                        onClick={onSendClick}
                        className="rounded-1-none btn btn-info"
                    >
                        {messageSending && (
                            <span className="loading loading-spinner loading-xs"></span>
                        )}
                        <PaperAirplaneIcon className="w-6" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
                {inputErrorMessage && (
                    <p className="text-xs text-red-400">{inputErrorMessage}</p>
                )}
            </div>
            <div className="xs:order-3 order-3 flex p-2">
                <button className="p-1 text-gray-400 hover:text-gray-300">
                    <FaceSmileIcon className="h-6 w-6" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-300">
                    <HandThumbUpIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
