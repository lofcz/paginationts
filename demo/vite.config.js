import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import mkcert from 'vite-plugin-mkcert'
import { copy } from 'vite-plugin-copy';

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
        mkcert(),
        copy({
            targets: [
                {
                    src: 'highlight.js',
                    dest: 'dist'
                },
                {
                    src: 'highlight.css',
                    dest: 'dist'
                }
            ]
        })
    ],
    build: {
        cssCodeSplit: true,
        cssMinify: true,
    }
});
