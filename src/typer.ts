import * as ts from 'typescript';

import {defaultOptions, Options} from './options';
import {turnToDeclarations} from './passes/declarations';
import {format} from './passes/format';
import {infer} from './passes/infer';
import {updateExports} from './passes/update_exports';
import {updateImports} from './passes/update_imports';
import {updateVars} from './passes/update_vars';
import {AddChangeCallback, LanguageServiceReactor} from './utils/language_service_reactor';
import {mapKeys} from './utils/maps';

export interface TyperExecutionMetadata { inferencePasses: number, }
export interface TyperExecutionResult {
  files: {[fileName: string]: string},  // Map<string, string>,
  metadata: TyperExecutionMetadata,
}

export function runTyper(
    fileContents: {[fileName: string]: string},
    options = defaultOptions): TyperExecutionResult {

    // fileContents = {
    //   ...fileContents,
    //   'foo.ts': `
    //     export function fooFoo(x) {}
    //   `
    //   // 'node_modules/typescript/lib/lib.dom.d.ts': `
    //   //   declare var document: {
    //   //     getElementById(id: string): number;
    //   //   };
    //   // `
    // }
  const reactor =
      new LanguageServiceReactor(fileContents, options.currentWorkingDir, options.dependenciesFileName, {
        target: ts.ScriptTarget.ES2017,
        module: ts.ModuleKind.ES2015,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        //lib: ["dom", "es2017"],
        allowJs: true,
        strictNullChecks: true,
        removeComments: true,
      } as ts.CompilerOptions);

  if (options.updateImports) reactor.react(updateImports);
  if (options.updateExports) reactor.react(updateExports);

  const inferrer = infer(options);
  let inferencePasses = 0;
  for (let i = 0; i < options.maxIterations; i++) {
    if (options.debugPasses) {
      console.warn(
          `Running incremental type inference (${i +
          1} / ${options.maxIterations})...`);
    }
    inferencePasses++;
    if (!reactor.react(inferrer)) {
      break;
    }
    if (options.debugPasses) {
      console.warn(`Partial result after inference pass ${i + 1}:`);
      const fileContents = reactor.fileContents;
      for (const fileName in fileContents) {
        const contents = fileContents[fileName];
        console.warn(`${fileName}:\n${contents}\n`);
      }
    }
  }

  const metadata = {
    inferencePasses: inferencePasses
  }

  if (options.format) reactor.react(format);
  if (options.updateVars) reactor.react(updateVars);
  if (options.declarations) {
    reactor.react(turnToDeclarations);

    return {
      files: mapKeys(reactor.fileContents, k => k.replace(/.[tj]s/, '.d.ts')),
      metadata
    };
  }

  return {
    files: reactor.fileContents, metadata
  }
}
