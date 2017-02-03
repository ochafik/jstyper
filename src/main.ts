/// <reference path="../node_modules/@types/node/index.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import {LanguageServiceReactor, AddChangeCallback} from './language_service_reactor';
import {infer} from './infer';
import {format} from './format';
import {updateVars} from './update_vars';
import {updateImports} from './update_imports';

const fileNames = process.argv.slice(2);
const fileContents = new Map<string, string>();
for (const fileName of fileNames) {
  fileContents.set(fileName, fs.readFileSync(fileName).toString());
}

const reactor = new LanguageServiceReactor(fileContents, {
    allowJs: true,
    strictNullChecks: true,
});

reactor.react(updateImports);

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
    console.log(content);
}
