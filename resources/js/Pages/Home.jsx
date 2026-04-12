import ChatLayout from '@/Layouts/ChatLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function Home({ auth }) {
    return <>messages</>;
}

Home.layout = (page) => {
    return (
        <AuthenticatedLayout user={page.props.auth.user}>
            <ChatLayout children={page}/>
        </AuthenticatedLayout>
    )
}

export default Home;