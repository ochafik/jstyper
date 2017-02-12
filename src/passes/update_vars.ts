import * as ts from 'typescript';
import {AddChangeCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';

export function updateVars(
    fileNames: string[], services: ts.LanguageService,
    addChange: AddChangeCallback) {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      nodes.traverse(sourceFile, (node: ts.Node) => {
        if (nodes.isVariableDeclarationList(node)) {
          const text = node.getFullText();
          if (text.trim().startsWith('var')) {
            addChange(sourceFile.fileName, {
              span: {start: node.getStart(), length: 'var'.length},
              newText: 'let'
            });
          }
          // console.log(`FOUND DECLS: ${varDecls.getFullText()}`);
        }
      });
    }
  }
}
