import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
    root: './demo',
    base: './',
    css: {
        preprocessorOptions: {
            scss: {

            }
        },
        devSourcemap: true,
    },
    server: {
        https: true,
        watch: {
            included: ['../src/**'],
        },
        proxy: {
            '/flickr': {
                target: 'https://api.flickr.com/services',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/flickr/, '')
            }
        }
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src')
        }
    },
    plugins: [
        cssInjectedByJsPlugin(),
        mkcert()
    ],
    build: {
        cssCodeSplit: true,
        cssMinify: true,
    }
});
