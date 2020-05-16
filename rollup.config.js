import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { eslint } from 'rollup-plugin-eslint';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const { PRODUCTION } = process.env;

export default [
  {
    input: 'src/main.js',
    output: {
      name: 'OverflowMenu',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve(),
      eslint(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: ['node_modules/**'],
      }),
      ...PRODUCTION
        ? [terser()]
        : [],
    ],
  },
];
