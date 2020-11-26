import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete'
import { terser } from 'rollup-plugin-terser';
import { eslint } from 'rollup-plugin-eslint';
import pkg from './package.json';

const name = 'OverflowMenu';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
];

const isProduction = process.env.PRODUCTION;

// https://rollupjs.org/guide/en#outputglobals
const globals = {};

// noinspection JSUnusedGlobalSymbols
export default {
  input: './src/index.ts',

  // https://rollupjs.org/guide/en#external
  external: [],

  plugins: [
    // Clear the dist directory before build
    del({ targets: 'dist/*' }),

    // Allows node_modules resolution
    resolve({ extensions }),

    // Lint the code on build
    eslint(),

    // Output types
    typescript({ useTsconfigDeclarationDir: true }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Inject the environment to tree shake away development specific code
    replace({
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
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
      exports: 'auto',
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
      sourcemapExcludeSources: isProduction,
      plugins: [terser()],
    },
  ],
};
