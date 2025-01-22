import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

const banner = `/**
 * PaginationTS - https://github.com/lofcz/paginationts
 * @version 1.0.0
 * @license MIT
 * @copyright (c) ${new Date().getFullYear()} Matěj "lofcz" Štágl
 */`;

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/paginationts.js',
            format: 'umd',
            name: 'pagination',
            sourcemap: true,
            banner
        },
        plugins: [
            nodeResolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: './dist/types'
            }),
            terser()
        ]
    },
    {
        input: 'src/styles.scss',
        output: {
            file: 'dist/pagination.css'
        },
        plugins: [
            postcss({
                extract: true,
                minimize: true,
                use: ['sass'],
                sourceMap: true,
                extensions: ['.scss'],
                plugins: []
            })
        ]
    }
];
