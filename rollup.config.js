import pkg from './package.json';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from "rollup-plugin-terser";

const {PRODUCTION} = process.env

export default [
    {
        input: 'src/main.js',
        output: {
            name: 'OverflowMenu',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [
            resolve(),
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                exclude: ['node_modules/**']
            }),
            ...PRODUCTION
                ? [terser()]
                : []
        ]
    },
    {
        input: 'src/main.js',
        output: [
            {file: pkg.main, format: 'cjs'},
            {file: pkg.module, format: 'es'}
        ],
        plugins: [
            babel({
                babelHelpers: 'bundled',
                exclude: ['node_modules/**']
            })
        ]
    }
];
