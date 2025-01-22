import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: './demo',
    base: './',
    css: {
        preprocessorOptions: {
            scss: {

            }
        }
    },
    server: {
        watch: {
            included: ['../src/**'],
        }
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src')
        }
    }
});
