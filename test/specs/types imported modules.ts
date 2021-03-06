// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.ts': `
      import {a, b, c} from 'foo';
      
      a && a();
      b(1) == 2;
      c = 2;
          
          
    `
  },
  options: {},
  result: {
    files: {
      'input.ts': `
      import {a, b, c} from 'foo';
      
      a && a();
      b(1) == 2;
      c = 2;
          
          
    `
    },
    metadata: {
      inferencePasses: 1
    }
  }
} as TestSpec
