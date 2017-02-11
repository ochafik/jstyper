import * as ts from "typescript";
import * as nodes from './nodes';

export function guessName(node: ts.Node): string | undefined {
  if (nodes.isCallExpression(node)) {
    let name: string | undefined;
    if (node.name) {
      name = guessName(node.name);
    } else if (node.expression) {
      name = guessName(node.expression);
    }
    if (name) {
      const exec = /^(?:(?:get|set|build|create|new)_*)(.*)$/.exec(name);
      if (exec) {
        const n = exec[1];
        if (n) {
          name = n[0].toLowerCase() + n.substr(1);
        }
      }
      return name;
    }
  } else if (nodes.isElementAccessExpression(node)) {
    if (node.argumentExpression && nodes.isStringLiteral(node.argumentExpression)) {
      return node.argumentExpression.text;
    }
  } else if (nodes.isPropertyAccessExpression(node)) {
    return guessName(node.name);
  } else if (nodes.isIdentifier(node)) {
    return node.text;
  }
  return undefined;
}
