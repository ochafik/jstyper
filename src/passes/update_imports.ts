import * as ts from "typescript";
import {AddChangeCallback} from '../utils/language_service_reactor';
import {traverse} from '../utils/nodes';

export function updateImports(fileNames: string[], services: ts.LanguageService, addChange: AddChangeCallback) {
  
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      traverse(sourceFile, (node: ts.Node) => {
        
        const path = getRequiredPath(node);
        if (path) {
          // TODO
          console.warn(`FOUND require of ${path.text}`);
        }
      });
    }
  }
}

function getRequiredPath(node: ts.Node): ts.StringLiteral | undefined {
  if (node.kind == ts.SyntaxKind.CallExpression) {
    const call = <ts.CallExpression>node;
    if (call.expression.kind == ts.SyntaxKind.Identifier) {
      const id = <ts.Identifier>(call.expression);
      if (id.text == 'require' && call.arguments.length == 1 && !call.typeArguments) {
        const [arg] = call.arguments;
        if (arg.kind == ts.SyntaxKind.StringLiteral) {
          return <ts.StringLiteral>arg;
        }
      }
    }
  }
  return undefined;
}