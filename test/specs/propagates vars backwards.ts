// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      function f(xx, y) {
        var zz1;
        zz1 = z;
        zz1 = '';
      
        var zz2 = z;
        zz2 = '';
        return x + 2 + g(y);
      }
      
      function g(x) {
        return x * 2;
      }
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
        function f(xx, y: number) {
          let zz1: string;
          zz1 = z;
          zz1 = '';
        
          let zz2: string = z;
          zz2 = '';
          return x + 2 + g(y);
        }
        
        function g(x: number): number {
          return x * 2;
        }
      `
    },
    metadata: {
      inferencePasses: 3
    }
  }
} as TestSpec
