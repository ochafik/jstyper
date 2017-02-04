import typescript from 'rollup-plugin-typescript';
import uglify from 'rollup-plugin-uglify';
// import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import replace from 'rollup-plugin-replace';

export default {
  entry: './src/demo.ts',
  format: 'iife',
  dest: 'build/demo-bundle.js',
  external: ['typescript'],
  // sourceMap: true,
  plugins: [
    // replace({
    //   'process.env.NODE_ENV' : JSON.stringify('production'),
    //   // Workaround for https://github.com/rollup/rollup/issues/795:
    //   // './example': './example.tsx',
    // }),
    typescript({
      // Force usage of same version of typescript as the project:,
      typescript: require('typescript')
    }),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    // commonjs({
    //   include: 'node_modules/**',
    //   namedExports: {
    //     'react' : [
    //       'Component',
    //       'Children',
    //       'createElement',
    //       'PropTypes'
    //     ],
    //     'react-dom' : ['render'],
    //     'immutable': [
    //       'Iterable',
    //       'Seq',
    //       'Collection',
    //       'Map',
    //       'OrderedMap',
    //       'List',
    //       'Stack',
    //       'Set',
    //       'OrderedSet',
    //       'Record',
    //       'Range',
    //       'Repeat',
    //       'is',
    //       'fromJS',
    //     ],
    //   },
    // }),
    // uglify({sourceMap: true}),
    filesize(),
  ]
}
