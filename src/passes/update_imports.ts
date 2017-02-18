import * as ts from 'typescript';
import {ReactorCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';
import {Mutator} from '../utils/mutator';

export const updateImports: ReactorCallback = (fileNames, services, addChange, _) => {
  const program = services.getProgram();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      const mutator = new Mutator(sourceFile.fileName, addChange);

      nodes.traverse(sourceFile, (node: ts.Node) => {
        if (nodes.isVariableStatement(node) && node.declarationList.declarations.length == 1) {
          const [decl] = node.declarationList.declarations;
          if (nodes.isIdentifier(decl.name)) {
            const requiredPath = nodes.getRequiredPath(decl.initializer);
            if (requiredPath) {
              mutator.removeNode(node, `import * as ${decl.name.text} from '${requiredPath}';`);
            }
          }
        }
      });
    }
  }
};
