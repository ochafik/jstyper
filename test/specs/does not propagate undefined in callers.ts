// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      function g1(x) { return x * 2; }
      function f1(x) { g1(x); g1(); }

      function g2(x) { return x === null ? 1 : x * 2; }
      function f2(x) { g2(x); g2(); }
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
      function g1(x?: number): number { return x * 2; }
      function f1(x: number): void { g1(x); g1(); }

      function g2(x?: number | null): number { return x === null ? 1 : x * 2; }
      function f2(x: number): void { g2(x); g2(); }
    `
    },
    metadata: {
      inferencePasses: 3
    }
  }
} as TestSpec
