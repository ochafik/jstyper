import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import { minify } from 'uglify-js-harmony';
import babel from 'rollup-plugin-babel';

export default {
  entry: './src/demo.ts',
  format: 'iife',
  dest: 'build/demo-bundle.js',
  external: ['typescript'],
  globals: {
    typescript: 'ts'
  },
  sourceMap: true,
  plugins: [
    typescript({
      // Force usage of same version of typescript as the project:,
      typescript: require('typescript')
    }),
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    uglify({sourceMap: true}, minify),
    filesize(),
  ]
}
