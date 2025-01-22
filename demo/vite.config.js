import { defineConfig } from 'vite';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import mkcert from 'vite-plugin-mkcert'
import { copy } from 'vite-plugin-copy';
import fs from 'fs-extra';


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
        {
            name: 'copy-highlight-files',
            closeBundle() {
                // Zajistíme, že assets složka existuje
                fs.ensureDirSync('dist/assets');

                // Kopírujeme oba soubory
                fs.copyFileSync('demo/highlight.js', 'demo/dist/assets/highlight.js');
                fs.copyFileSync('demo/highlight.css', 'demo/dist/assets/highlight.css');
            }
        }
    ],
    build: {
        cssCodeSplit: true,
        cssMinify: true,
    }
});
