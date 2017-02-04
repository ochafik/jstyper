/// <reference path="../node_modules/@types/node/index.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import {LanguageServiceReactor, AddChangeCallback} from './utils/language_service_reactor';
import {infer} from './passes/infer';
import {format} from './passes/format';
import {updateVars} from './passes/update_vars';
import {updateImports} from './passes/update_imports';
import {updateExports} from './passes/update_exports';

const fileNames = process.argv.slice(2);
const fileContents = new Map<string, string>();
for (const fileName of fileNames) {
  if (!fileName.endsWith('.js')) continue;

  const tsFileName = fileName.slice(0, -3) + '.ts';
  fileContents.set(tsFileName, fs.readFileSync(fileName).toString());
}

const reactor = new LanguageServiceReactor(fileContents, {
    allowJs: true,
    strictNullChecks: true,
    removeComments: true,
});

reactor.react(updateImports);
reactor.react(updateExports);

const maxIterations = 5;
for (let i = 0; i < maxIterations; i++) {
    console.warn(`Running incremental type inference (${i + 1} / ${maxIterations})...`);
    if (!reactor.react(infer)) {
        break;
    }
}

reactor.react(format);
reactor.react(updateVars);

for (const [fileName, content] of reactor.fileContents) {
    console.warn(`${fileName}:`);
    console.warn(content);
    if (!fs.existsSync(fileName) || content != fs.readFileSync(fileName).toString()) {
        fs.writeFileSync(fileName, content);
    }
}
