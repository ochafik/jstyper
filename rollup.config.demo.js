import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import { minify } from 'uglify-js-harmony';
import babel from 'rollup-plugin-babel';

const isDev = process.env.DEV == '1'
console.warn(`DEV: ${isDev}`);

export default {
  entry: './src/demo.ts',
  dest: 'build/demo.js',
  format: 'iife',
  sourceMap: true,
  external: ['typescript'],
  globals: {
    typescript: 'ts'
  },
  plugins: [
    typescript({typescript: require('typescript')}),
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    ...(isDev ? [] : [
      babel({exclude: 'node_modules/**'}),
      uglify({sourceMap: true}, minify),
    ]),
    filesize()
  ]
}
