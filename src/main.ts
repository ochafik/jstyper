import * as fs from "fs";
import {runTyper, defaultOptions, Options} from './typer';

const fileNames = process.argv.slice(2);
const fileContents = new Map<string, string>();
for (const fileName of fileNames) {
  if (!fileName.endsWith('.js')) continue;

  const tsFileName = fileName.slice(0, -3) + '.ts';
  fileContents.set(tsFileName, fs.readFileSync(fileName).toString());
}

const options = <Options>new Object(defaultOptions);
options.currentWorkingDir = process.cwd();
const results = runTyper(fileContents, options);

for (const [fileName, content] of results) {
    console.warn(`${fileName}:`);
    console.warn(content);
    if (!fs.existsSync(fileName) || content != fs.readFileSync(fileName).toString()) {
        fs.writeFileSync(fileName, content);
    }
}
