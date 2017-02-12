// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      function f4(x) {
        return x * 2;
      }
      
      function g4(x, o) {
        if (o.addValue) {
          return f4(x) + o.value;
        }
        return o.name == 'default' ? x : 'y';
      }
      
      function gg4(x, y) {
        var v = g4(x, y);
        return v;
      }
      
      function h4(x) {
        return x ? x.length : 0;
      }
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
        function f4(x: number): number {
          return x * 2;
        }
        
        function g4(x: number, o: {addValue: boolean, value: any, name: string}) {
          if (o.addValue) {
            return f4(x) + o.value;
          }
          return o.name == 'default' ? x : 'y';
        }
        
        function gg4(x: number, y: {addValue: boolean, value: any, name: string}) {
          let v = g4(x, y);
          return v;
        }
        
        function h4(x: string) {
          return x ? x.length : 0;
        }
      `
    },
    metadata: {
      inferencePasses: 4
    }
  }
} as TestSpec
