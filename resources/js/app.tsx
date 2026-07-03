import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from './Contexts/ConfirmContext';
import { UploadProvider } from './Contexts/UploadContext';
import { EventBusProvider } from './EventBus';

const reverbConfig = (window as any).reverb || {};

configureEcho({
    broadcaster: 'reverb',
    key: reverbConfig.key || import.meta.env.VITE_REVERB_APP_KEY || '',
    wsHost:
        reverbConfig.host ||
        import.meta.env.VITE_REVERB_HOST ||
        window.location.hostname,
    wsPort: reverbConfig.port
        ? Number(reverbConfig.port)
        : import.meta.env.VITE_REVERB_PORT
          ? Number(import.meta.env.VITE_REVERB_PORT)
          : 80,
    wssPort: reverbConfig.port
        ? Number(reverbConfig.port)
        : import.meta.env.VITE_REVERB_PORT
          ? Number(import.meta.env.VITE_REVERB_PORT)
          : 443,
    forceTLS:
        reverbConfig.scheme === 'https' ||
        import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
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
