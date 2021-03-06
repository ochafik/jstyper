// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'foo.ts': `
      x => x * 2;
      (x) => x * 2;
      x/*what*/=> x * 2;
    `
  },
  options: {},
  result: {
    files: {
      'foo.ts': `
      (x: number) => x * 2;
      (x: number) => x * 2;
      x/*what*/=> x * 2;
    `
    },
    metadata: {
      inferencePasses: 2
    }
  }
} as TestSpec
