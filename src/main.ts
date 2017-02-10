import * as fs from "fs";
import * as path from 'path';
import {runTyper} from './typer';
import {defaultOptions, Options} from './options';

var argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);

const outputDir = argv.outputDir || argv.o;

const fileNames = argv['_'];

const inputContents: {[fileName: string]: string} = Object.create(null);
for (const fileName of fileNames) {
  if (!fileName.endsWith('.js')) {
    throw new Error(`File '${fileName}' does not have a JavaScript extension.`);
  }
  const tsFileName = fileName.slice(0, -3) + '.ts';
  inputContents[tsFileName] = fs.readFileSync(fileName).toString();
}

const options = <Options>{
  ...defaultOptions,
  currentWorkingDir: process.cwd(),
  ...argv
};
const results = runTyper(inputContents, options);

const metadataComment = `// ${results.metadata.inferencePasses} inference passes`;
    
for (const fileName in results.outputs) {
    let content = results.outputs[fileName];
    // console.warn(content);
    
    // content += '\n\n' + metadataComment
    
    if (!fs.existsSync(fileName) || content != fs.readFileSync(fileName).toString()) {
        let outputFile = fileName;
        if (outputDir) {
          outputFile = path.join(outputDir, path.relative(options.currentWorkingDir, fileName));
        }
        mkdirsSync(path.dirname(outputFile));
        
        console.warn(`${path.relative(options.currentWorkingDir, outputFile)}: ${results.metadata.inferencePasses} inference passes`);
        fs.writeFileSync(outputFile, content);
    }
}

function mkdirsSync(dir: string) {
  dir.split(path.sep).reduce((d, component) => {
    const dir = (d && d + '/' || '') + component;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    return dir;
  }, '');
}