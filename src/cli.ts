import * as fs from 'fs';
import * as path from 'path';

import {defaultOptions, Options} from './options';
import {TestSpec, writeSpec} from './testing/test_spec';
import {runTyper} from './typer';
import {getFile, mkdirsSync} from './utils/files';
import {pseudoJson} from './utils/pseudo_json';

var argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);

const force = argv.force || argv.f;
const outputDir = argv.outputDir || argv.o || 'build';
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

console.warn(`${results.metadata.inferencePasses} inference passes`);

if (outputToStdout) {
  console.log(pseudoJson(results));
} else if (testSpecDescription) {
  writeSpec(testSpecDescription, {
    files: inputContents,
    options: options,
    result: results
  });
} else {
  const filesToWrite: [string, string][] = [];
  for (const fileName in results.files) {
    const outputFile = getFile(
        fileName,
        {outputDir: outputDir, currentWorkingDir: options.currentWorkingDir});
    const content = results.files[fileName];

    if (fs.existsSync(outputFile) && !force) {
      console.warn(`${outputFile} already exists. Choose another --outputDir or --force overwrite.`);
      process.exit(1);
    }
    console.warn(`${outputFile}`);

    filesToWrite.push([outputFile, content]);
  }
  for (const [outputFile, content] of filesToWrite) {
    if (!fs.existsSync(outputFile) ||
        content != fs.readFileSync(outputFile).toString()) {
      mkdirsSync(path.dirname(outputFile));

      fs.writeFileSync(outputFile, content);
    }
  }
}
