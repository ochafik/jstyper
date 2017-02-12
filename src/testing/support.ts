import * as assert from 'assert';
import {expect} from 'chai';
import * as mocha from 'mocha';

import {runTyper} from '../typer';
import {defaultOptions} from '../options';

import {readSpec, TestSpec, writeSpec} from './test_spec';

const updateSpecs: boolean = process.env.UPDATE_SPECS == '1';

export function typerTest(specFile: string):
    (this: mocha.ITestCallbackContext) => Promise<any> {
  return async function() {
    const builtFile =
        process.cwd() + '/' + specFile.replace(/^(.*?)\.ts$/, 'build/$1.js');
    const spec = readSpec(builtFile);
    if (!spec) {
      throw new Error(`Unable to read ${builtFile}`);
    }

    const result = runTyper(spec.files, {...defaultOptions, ...spec.options});

    const actualSpec: TestSpec = {
      files: spec.files,
      options: spec.options,
      result: result
    };

    if (updateSpecs) {
      await writeSpec(specFile, actualSpec);
    } else {
      for (const fileName in actualSpec.result.files) {
        expect(actualSpec.result.files[fileName]).to.be.deep.equal(spec.result.files[fileName]);  
      }
      expect(actualSpec).to.be.deep.equal(spec);
      // assert.deepEqual(actualSpec, spec);
    }
  }
}