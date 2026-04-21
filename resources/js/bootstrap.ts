import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const w = window as typeof window & {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'>;
};

w.Pusher = Pusher;

const reverbScheme = (
    import.meta.env.VITE_REVERB_SCHEME ??
    window.location.protocol.replace(':', '')
).toLowerCase();

const forceTLS = reverbScheme === 'https';
const reverbPort = Number(
    import.meta.env.VITE_REVERB_PORT ?? (forceTLS ? 443 : 8080),
);

w.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
});
