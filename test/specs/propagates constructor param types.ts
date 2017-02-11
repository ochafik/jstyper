// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  inputs: {
    'example.ts': `
      class Foo {
        constructor(x) {
          x.bar();
        }
      }
      
    `
  },
  outputs: {
    'example.ts': `
      class Foo {
        constructor(x) {
          x.bar();
        }
      }
      
    `
  },
  metadata: {
    inferencePasses: 1
  }
} as TestSpec
