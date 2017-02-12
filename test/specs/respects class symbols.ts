// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      class Foo { x: number; }
      
      function f7(foo: Foo) {
        return foo ? foo.x : null;
      }
      
      function g7(foo) {
        return foo ? foo.x : null;
      }
      
      g7(new Foo());
    `
  },
  options: {
    
  },
  result: {
    files: {
      'input.js': `
        class Foo {x: number;}
        
        function f7(foo?: Foo): number | null {
          return foo ? foo.x : null;
        }
        
        function g7(foo?: Foo): number | null {
          return foo ? foo.x : null;
        }
        
        g7(new Foo());
      `
    },
    metadata: {
      inferencePasses: 3
    }
  }
} as TestSpec
