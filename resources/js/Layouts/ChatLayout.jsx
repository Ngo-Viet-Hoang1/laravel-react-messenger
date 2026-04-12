import { usePage } from "@inertiajs/react";

const ChatLayout = ({ children }) => {
    const page = usePage();
    const conversation = page.props.conversation;
    const selectedConversation = page.props.selectedConversation;

    console.log('conversation', conversation);
    console.log('selectedConversation', selectedConversation);

    return (
        <>
            ChatLayout
            <div>
                {children}
            </div>
        </>
    );
}

export default ChatLayout;