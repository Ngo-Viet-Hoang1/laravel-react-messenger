import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from './Contexts/ConfirmContext';
import { UploadProvider } from './Contexts/UploadContext';
import { EventBusProvider } from './EventBus';

configureEcho({
    broadcaster: 'reverb',
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <EventBusProvider>
                <ConfirmProvider>
                    <UploadProvider>
                        <App {...props} />
                    </UploadProvider>
                </ConfirmProvider>
            </EventBusProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
