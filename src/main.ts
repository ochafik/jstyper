/// <reference path="../node_modules/@types/node/index.d.ts" />

import * as fs from "fs";
import * as ts from "typescript";
import {LanguageServiceReactor, AddChangeCallback} from './language_service_reactor';
import {infer} from './infer';
import {format} from './format';

const fileNames = process.argv.slice(2);
const fileContents = new Map<string, string>();
for (const fileName of fileNames) {
  fileContents.set(fileName, fs.readFileSync(fileName).toString());
}

const reactor = new LanguageServiceReactor(fileContents, {
    allowJs: true,
    strictNullChecks: true,
});

const maxIterations = 5;
for (let i = 0; i < maxIterations; i++) {
    console.log(`Running incremental type inference (${i + 1} / ${maxIterations})...`);
    if (!reactor.react(infer)) {
        break;
    }
}

reactor.react(format);

for (const [fileName, content] of reactor.fileContents) {
    console.log(`
RESULT[${fileName}]:
${content}
        
    `);
}
