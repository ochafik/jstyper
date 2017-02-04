import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';

export default {
  entry: './src/demo.ts',
  format: 'iife',
  dest: 'build/demo-bundle.js',
  external: ['typescript'],
  sourceMap: true,
  plugins: [
    typescript({
      // Force usage of same version of typescript as the project:,
      typescript: require('typescript')
    }),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    // uglify({sourceMap: true}),
    filesize(),
  ]
}
