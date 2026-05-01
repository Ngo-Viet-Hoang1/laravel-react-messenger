import forms from '@tailwindcss/forms';
import daisyui from 'daisyui';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
        screens: {
            xs: '420px',
            sm: '680px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
        }
    },

    plugins: [forms, daisyui],

    daisyui: {
        themes: ['dark', 'light'],
        darkTheme: 'dark',
        base: true,
        style: true,
        utils: true,
        prefix: '',
        logs: true,
        themeRoot: ':root',
    },
};
