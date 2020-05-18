import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const name = 'OverflowMenu';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
];

// https://rollupjs.org/guide/en#outputglobals
const globals = {};

export default {
  input: './src/index.ts',

  // https://rollupjs.org/guide/en#external
  external: [],

  plugins: [
    // Allows node_modules resolution
    resolve({ extensions }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Inject the environment to tree shake away development specific code
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.PRODUCTION ? 'production' : 'development'
      )
    }),

    // Compile TypeScript/JavaScript files
    babel({
      extensions,
      babelHelpers: 'bundled',
      include: ['src/**/*'],
    }),
  ],

  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
    {
      file: pkg.browser,
      format: 'umd',
      name,
      globals,
    },
    {
      file: pkg.minified,
      format: 'umd',
      name,
      globals,
      compact: true,
      sourcemap: true,
      sourcemapExcludeSources: process.env.PRODUCTION,
      plugins: [terser()],
    },
  ],
};
