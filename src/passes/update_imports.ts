import * as ts from 'typescript';
import {AddChangeCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';

export function updateImports(
    fileNames: string[], services: ts.LanguageService,
    addChange: AddChangeCallback) {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      nodes.traverse(sourceFile, (node: ts.Node) => {

        const path = getRequiredPath(node);
        if (path) {
          // TODO
          console.warn(`FOUND require of ${path.text}`);
        }
      });
    }
  }
}

function getRequiredPath(node: ts.Node): ts.StringLiteral|undefined {
  if (nodes.isCallExpression(node)) {
    const call = <ts.CallExpression>node;
    if (nodes.isIdentifier(call.expression)) {
      const id = <ts.Identifier>(call.expression);
      if (id.text == 'require' && call.arguments.length == 1 &&
          !call.typeArguments) {
        const [arg] = call.arguments;
        if (nodes.isStringLiteral(arg)) {
          return <ts.StringLiteral>arg;
        }
      }
    }
  }
  return undefined;
}