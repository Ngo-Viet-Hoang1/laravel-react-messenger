import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChatLayout from '@/Layouts/ChatLayout';

function Home() {
    return (
        <>Messages</>
    );
}

Home.layout = (page) => {
    return (
        <AuthenticatedLayout>
            <ChatLayout children={page} />
        </AuthenticatedLayout>
    );
}

export default Home;