import * as ts from 'typescript';
import * as nodes from '../utils/nodes';

export function getSymbol(node: ts.Node, checker: ts.TypeChecker): ts.Symbol | undefined {
  if (nodes.isConstructor(node) || nodes.isArrowFunction(node) ||
      nodes.isFunctionExpression(node)) {
    const sym = node['symbol'];  // this.checker.getSymbolAtLocation(node);
    return sym;
  } else if (nodes.isVariableDeclaration(node)) {
    return getSymbol(node.name, checker);
  } else if (nodes.isFunctionLikeDeclaration(node) || nodes.isInterfaceDeclaration(node)) {
    return node.name && getSymbol(node.name, checker);
  } else if (nodes.isIdentifier(node)) {
    return checker.getSymbolAtLocation(node);
  } else {
    return undefined;
  }
}
