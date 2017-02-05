import * as fs from "fs";
import {runTyper} from './typer';
import {defaultOptions, Options} from './options';

const fileNames = process.argv.slice(2);
const fileContents = new Map<string, string>();
for (const fileName of fileNames) {
  if (!fileName.endsWith('.js')) continue;
//   if (fileName.indexOf('5') < 0) continue;

  const tsFileName = fileName.slice(0, -3) + '.ts';
  fileContents.set(tsFileName, fs.readFileSync(fileName).toString());
}

const options = <Options>new Object(defaultOptions);
options.currentWorkingDir = process.cwd();
// options.maxIterations = 1;
const results = runTyper(fileContents, options);

const metadataComment = `// ${results.inferencePasses} inference passes`;
    
for (let [fileName, content] of results.fileContents) {
    console.warn(`${fileName}:`);
    console.warn(content);
    
    content += '\n\n' + metadataComment
    
    if (!fs.existsSync(fileName) || content != fs.readFileSync(fileName).toString()) {
        fs.writeFileSync(fileName, content);
    }
}
