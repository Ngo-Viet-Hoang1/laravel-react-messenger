import ChatLayout from '@/Layouts/ChatLayout';

function Home() {
    return (
        <>Messages</>
    );
}

Home.layout = (page) => {
    return (
        <>
            <ChatLayout children={page} />
        </>
    );
}

export default Home;