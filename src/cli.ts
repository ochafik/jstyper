import * as fs from 'fs';
import * as path from 'path';

import {defaultOptions, Options} from './options';
import {TestSpec, writeSpec} from './testing/test_spec';
import {runTyper} from './typer';
import {getFile, mkdirsSync} from './utils/files';
import {pseudoJson} from './utils/pseudo_json';

var argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);

const outputDir = argv.outputDir || argv.o;
const outputToStdout = outputDir == '-';
const testSpecDescription = argv.testSpec;

const fileNames = argv['_'];

const inputContents: {[fileName: string]: string} = Object.create(null);
for (const fileName of fileNames) {
  if (!fileName.endsWith('.js')) {
    console.warn(
        `ERROR: file '${fileName}' does not have a JavaScript extension.`);
    process.exit(1);
  }
  const tsFileName = fileName.slice(0, -3) + '.ts';
  inputContents[tsFileName] = fs.readFileSync(fileName).toString();
}

const options =
    <Options>{...defaultOptions, currentWorkingDir: process.cwd(), ...argv};
const results = runTyper(inputContents, options);

if (outputToStdout) {
  console.log(pseudoJson(results));
} else if (testSpecDescription) {
  writeSpec(testSpecDescription, {
    inputs: inputContents,
    outputs: results.outputs,
    metadata: results.metadata
  });
} else {
  for (const fileName in results.outputs) {
    const outputFile = getFile(
        fileName,
        {outputDir: outputDir, currentWorkingDir: options.currentWorkingDir});
    const content = results.outputs[fileName];
    if (!fs.existsSync(outputFile) ||
        content != fs.readFileSync(outputFile).toString()) {
      mkdirsSync(path.dirname(outputFile));

      console.warn(`${outputFile}: ${results.metadata.inferencePasses
                   } inference passes`);
      fs.writeFileSync(outputFile, content);
    }
  }
}
