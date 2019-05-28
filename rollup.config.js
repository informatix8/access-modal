import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [

    //
    // DEV BUNDLE
    //

    {
        input: 'src/js/main.js',
        output: {
            name: 'AccessModal',
            file: 'public/bundle.js',
            format: 'iife',
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },

    //
    // PROD BUNDLE
    //

    {
        input: 'src/js/main.js',
        output: {
            name: 'AccessModal',
            file: 'dist/access-modal.umd.js',
            format: 'umd',
            compact: true
        },
        external: [
            'short-unique-id',
            'lodash.merge'
        ],
        plugins: [
            resolve(),
            commonjs(),
            terser({
                ecma: 5
            }),
            filesize()
        ]
    },
    {
        input: 'src/js/main.js',
        output: {
            name: 'AccessModal',
            file: 'dist/access-modal.all.umd.js',
            format: 'umd',
            compact: true
        },
        plugins: [
            resolve(),
            commonjs(),
            terser({
                ecma: 5
            }),
            filesize()
        ]
    },
    {
        input: 'src/js/main.js',
        external: [
            'short-unique-id',
            'lodash.merge'
        ],
        output: [
            {
                file: pkg.main,
                compact: true,
                format: 'cjs'
            },
            {
                file: pkg.module,
                compact: true,
                format: 'es'
            }
        ],
        plugins: [
            terser({
                ecma: 5
            }),
            filesize()
        ]
    }
];
