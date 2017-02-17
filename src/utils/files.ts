import * as fs from 'fs';
import * as path from 'path';

export function mkdirsSync(dir: string) {
  dir.split(path.sep).reduce((d, component) => {
    const dir = (d && d + '/' || '') + component;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    return dir;
  }, '');
}

export function getFile(
    fileName: string,
    {outputDir, currentWorkingDir}:
        {outputDir?: string, currentWorkingDir?: string} = {}): string {
  let outputFile = fileName;
  if (outputDir) {
    outputFile =
        path.join(outputDir, path.relative(currentWorkingDir == null ? '.' : currentWorkingDir, fileName));
  }
  mkdirsSync(path.dirname(outputFile));
  return outputFile;
}