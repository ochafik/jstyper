import * as ts from "typescript";
import {LanguageServiceReactor, AddChangeCallback} from './utils/language_service_reactor';
import {infer} from './passes/infer';
import {format} from './passes/format';
import {updateVars} from './passes/update_vars';
import {updateImports} from './passes/update_imports';
import {updateExports} from './passes/update_exports';

export type Options = {
  format: boolean,
  updateImports: boolean,
  updateExports: boolean,
  updateVars: boolean,
  maxIterations: number,
  currentWorkingDir: string,
};

export const defaultOptions: Readonly<Options> = {
  format: true,
  updateImports: true,
  updateExports: true,
  updateVars: true,
  maxIterations: 5,
  currentWorkingDir: '.',
};

export function runTyper(fileContents: Map<string, string>, opts = defaultOptions) {
  const reactor = new LanguageServiceReactor(fileContents, opts.currentWorkingDir, {
      allowJs: true,
      strictNullChecks: true,
      removeComments: true,
  });

  if (opts.updateImports) reactor.react(updateImports);
  if (opts.updateExports) reactor.react(updateExports);

  for (let i = 0; i < opts.maxIterations; i++) {
      console.warn(`Running incremental type inference (${i + 1} / ${opts.maxIterations})...`);
      if (!reactor.react(infer)) {
          break;
      }
  }

  if (opts.format) reactor.react(format);
  if (opts.updateVars) reactor.react(updateVars);

  return reactor.fileContents;
}
