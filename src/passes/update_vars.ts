import * as ts from 'typescript';
import {ReactorCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';

export const updateVars: ReactorCallback = (fileNames, services, addChange, addRequirement) => {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      nodes.traverse(sourceFile, (node: ts.Node) => {
        if (nodes.isVariableStatement(node)) {
          if (node.modifiers) {
            for (const mod of node.modifiers) {
              if (nodes.isVarKeyword(mod)) {
                addChange(sourceFile.fileName, {
                  span: {start: mod.getStart(), length: mod.getFullWidth()},
                  newText: 'let'
                });
                return;
              }
            }
          }
          // console.log(`FOUND DECLS: ${varDecls.getFullText()}`);
        }
      });
    }
  }
}
