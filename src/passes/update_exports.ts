import * as ts from 'typescript';
import {AddChangeCallback} from '../utils/language_service_reactor';
import {traverse} from '../utils/nodes';

export function updateExports(
    fileNames: string[], services: ts.LanguageService,
    addChange: AddChangeCallback) {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      traverse(
          sourceFile,
          (node: ts.Node) => {
              // TODO

          });
    }
  }
}
