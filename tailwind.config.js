import forms from '@tailwindcss/forms';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
        screens: {
            xs: '475px',
            ...defaultTheme.screens,
        },
    },

    plugins: [forms, require('daisyui')],
    daisyui: {
        themes: true,
        darkTheme: 'dark',
        base: true,
        styled: true,
        utils: true,
        prefix: '',
        logs: process.env.NODE_ENV === 'development',
        themeRoot: ':root',
    },
};
