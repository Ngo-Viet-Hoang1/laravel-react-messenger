import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import echo from '../echo';

const ChatLayout = ({ children }) => {
    const page = usePage();
    const conversations = page.props.conversations ?? [];
    const selectedConversation = page.props.selectedConversation ?? null;

    console.log(conversations);
    console.log(selectedConversation);

    useEffect(() => {
        echo.join('online')
            .here((users) => {
                console.log('here', users);
            })
            .joining((user) => {
                console.log('joining', user);
            })
            .leaving((user) => {
                console.log('leaving', user);
            })
            .error((error) => {
                console.error('Failed joining online channel', error);
            });

        return () => {
            echo.leave('online');
        };
    }, []);

    return (
        <>
            ChatLayout
            <div>{children}</div>
        </>
    );
};

export default ChatLayout;
