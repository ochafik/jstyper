import typescript from 'rollup-plugin-typescript';
import nodeResolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';

export default {
  entry: './src/cli.ts',
  dest: 'build/cli.js',
  format: 'iife',
  external: ['typescript', 'fs', 'path'],
  globals: {
    typescript: 'ts',
    fs: 'fs',
    path: 'path',
  },
  plugins: [
    typescript({typescript: require('typescript')}),
    nodeResolve({jsnext: true, main: true, browser: true}),
    babel({exclude: 'node_modules/**'}),
    filesize()
  ]
}
