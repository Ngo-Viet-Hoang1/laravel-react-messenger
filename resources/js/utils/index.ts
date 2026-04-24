import { ChatItem, ChatMessage } from '@/types';

export function getChannelName(conversation: ChatItem, userId: number): string {
    if (conversation.is_user) {
        return `message.user.${[userId, conversation.id].sort((a, b) => a - b).join('-')}`;
    }
    return `message.group.${conversation.id}`;
}

export function isMessageForConversation(
    message: ChatMessage,
    conversation: ChatItem,
    currentUserId: number,
): boolean {
    const senderId = Number(message.sender_id);
    const receiverId = Number(message.receiver_id);
    const groupId = Number(message.group_id);

    if (conversation.is_group) {
        return groupId === conversation.id;
    }

    if (conversation.is_user) {
        const isOutgoing =
            senderId === currentUserId && receiverId === conversation.id;
        const isIncoming =
            senderId === conversation.id && receiverId === currentUserId;
        return isOutgoing || isIncoming;
    }

    return false;
}
