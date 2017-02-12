// SEMI-AUTOGENERATED FILE, PLEASE ONLY EDIT INPUTS.
//
// REGENERATE OUTPUTS AND METADATA WITH `npm run update-specs`.

import {TestSpec} from '../../src/testing/test_spec';

export default {
  files: {
    'input.js': `
      import {a, b, c} from 'foo';
      
      a && a();
      b(1) == 2;
      c = 2;
    `
  },
  options: {},
  result: {
    files: {
      'input.js': `
        import {a, b, c} from 'foo';
        
        a && a();
        b(1) == 2;
        c = 2;
      `,
      'node_modules/foo/index.d.ts': `
        declare module "foo" {
          export const a: (() => boolean) | undefined;
          export function b(arg1: number): number;
          export let c: number;
        }
        
      `
    },
    metadata: {
      inferencePasses: 2
    }
  }
} as TestSpec