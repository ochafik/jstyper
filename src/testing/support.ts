import * as assert from 'assert';
import * as mocha from 'mocha';
import {runTyper} from '../typer';
import {expect} from 'chai';
import {TestSpec, writeSpec, readSpec} from './test_spec';

const updateGoldens: boolean = process.env.UPDATE_GOLDENS == '1';

export function typerTest(specFile: string): (this: mocha.ITestCallbackContext) => Promise<any>  {
  return async function() {
    // console.warn(`${process.cwd()}`);
    const builtFile = process.cwd() + '/' + specFile.replace(/^(.*?)\.ts$/, 'build/$1.js');
    const spec = readSpec(builtFile);
    // console.warn(`FOUND ${JSON.stringify(spec, null, 2)}`);

    const result = <TestSpec>runTyper(spec.inputs);

    // const output = result.outputs[fileName];
    // const annotatedOutput = `/*\n${input}\n*/\n${output}\n// ${result.metadata.inferencePasses} inference passes`;
    const actualSpec = {
      inputs: spec.inputs,
      outputs: result.outputs,
      metadata: result.metadata
    };
    
    if (updateGoldens) {
      await writeSpec(specFile, actualSpec);
      // await writeFile(fileName, annotatedOutput);
    } else {
      // if (!fs.existsSync(specFile)) {
      //   throw new Error(`Golden file ${fileName} not found: update the tests with UPDATE_GOLDENS=1`);
      // } else {

        // const expected = (await readFile(fileName)).toString();
        //expect(annotatedOutput).to.be.equal(expected);
        assert.deepEqual(actualSpec, spec);
      // }
    }
  }
}