import * as assert from 'assert';
import * as mocha from 'mocha';
import {runTyper} from '../typer';
import {expect} from 'chai';
import {TestSpec, writeSpec, readSpec} from './test_spec';

const updateSpecs: boolean = process.env.UPDATE_SPECS == '1';

export function typerTest(specFile: string): (this: mocha.ITestCallbackContext) => Promise<any>  {
  return async function() {
    const builtFile = process.cwd() + '/' + specFile.replace(/^(.*?)\.ts$/, 'build/$1.js');
    const spec = readSpec(builtFile);

    const result = <TestSpec>runTyper(spec.inputs);

    const actualSpec = {
      inputs: spec.inputs,
      outputs: result.outputs,
      metadata: result.metadata
    };
    
    if (updateSpecs) {
      await writeSpec(specFile, actualSpec);
    } else {
      //expect(annotatedOutput).to.be.equal(expected);
      assert.deepEqual(actualSpec, spec);
    }
  }
}