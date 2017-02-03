import * as ts from "typescript";
import {AddChangeCallback} from './language_service_reactor';

export function updateImports(fileNames: string[], services: ts.LanguageService, addChange: AddChangeCallback) {
  
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      ts.forEachChild(sourceFile, visit);
      
      function visit(node: ts.Node) {
        // TODO
        ts.forEachChild(node, visit);
      }
    }
  }
}
