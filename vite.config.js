import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'fs';
import laravel from 'laravel-vite-plugin';
import { join, relative } from 'path';
import { defineConfig } from 'vite';

function collectPageInputs(dir, root = process.cwd()) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectPageInputs(fullPath, root));
        } else if (entry.name.endsWith('.tsx')) {
            // Normalize path separators: Windows use \, Vite need /
            files.push(relative(root, fullPath).replace(/\\/g, '/'));
        }
    }
    return files;
}

export default defineConfig({
    plugins: [
        tailwindcss(),
        laravel({
            input: [
                'resources/js/app.tsx',
                // All pages → each file is a separate entry point in the manifest
                ...collectPageInputs('resources/js/Pages'),
            ],
            refresh: true,
        }),
        react(),
    ],
});
