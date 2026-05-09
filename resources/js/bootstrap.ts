import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const csrfToken = document
	.querySelector('meta[name="csrf-token"]')
	?.getAttribute('content');

if (csrfToken) {
	window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

(window as any).Pusher = Pusher;
(window as any).Echo = new Echo({
	broadcaster: 'reverb',
	key: import.meta.env.VITE_REVERB_APP_KEY,
	wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
	wsPort: import.meta.env.VITE_REVERB_PORT || 80,
	wssPort: import.meta.env.VITE_REVERB_PORT || 443,
	forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
	enabledTransports: ['ws', 'wss'],
});

