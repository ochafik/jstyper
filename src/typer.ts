import * as ts from "typescript";
import {LanguageServiceReactor, AddChangeCallback} from './utils/language_service_reactor';
import {infer} from './passes/infer';
import {format} from './passes/format';
import {updateVars} from './passes/update_vars';
import {updateImports} from './passes/update_imports';
import {updateExports} from './passes/update_exports';
import {Options, defaultOptions} from './options';

export type TyperResult = {
    fileContents: Map<string, string>,
    inferencePasses: number,
};

export function runTyper(fileContents: Map<string, string>, options = defaultOptions): TyperResult {
  const reactor = new LanguageServiceReactor(fileContents, options.currentWorkingDir, {
      allowJs: true,
      strictNullChecks: true,
      removeComments: true,
  });

  if (options.updateImports) reactor.react(updateImports);
  if (options.updateExports) reactor.react(updateExports);

  const inferrer = infer(options);
  let inferencePasses = 0;
  for (let i = 0; i < options.maxIterations; i++) {
      console.warn(`Running incremental type inference (${i + 1} / ${options.maxIterations})...`);
      inferencePasses++;
      if (!reactor.react(inferrer)) {
          break;
      }
  }

  if (options.format) reactor.react(format);
  if (options.updateVars) reactor.react(updateVars);

  return {
      fileContents: reactor.fileContents,
      inferencePasses: inferencePasses
  }
}
