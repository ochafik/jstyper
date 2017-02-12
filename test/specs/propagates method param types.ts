// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'example.ts': `
      class Foo {
        constructor(x) {
          x.bar();
        }
        foo(x) {
          return x * 2;
        }
        set x(v) {
          v == ' '; 
        }
      }
    `
  },
  options: {
    
  },
  result: {
    files: {
      'example.ts': `
        class Foo {
          constructor(x: {bar(): void}) {
            x.bar();
          }
          foo(x: number): number {
            return x * 2;
          }
          set x(v: string) {
            v == ' ';
          }
        }
      `
    },
    metadata: {
      inferencePasses: 2
    }
  }
} as TestSpec
