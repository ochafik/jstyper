import * as ts from "typescript";

export function guessName(node: ts.Node): string | undefined {
  if (node.kind === ts.SyntaxKind.CallExpression) {
    const call = <ts.CallExpression>node;
    let name: string | undefined;
    if (call.name) {
      name = guessName(call.name);
    } else if (call.expression) {
      name = guessName(call.expression);
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
  } else if (node.kind == ts.SyntaxKind.ElementAccessExpression) {
    const access = <ts.ElementAccessExpression>node;
    if (access.argumentExpression && access.argumentExpression.kind == ts.SyntaxKind.StringLiteral) {
      return(<ts.StringLiteral>access.argumentExpression).text;
    }
  } else if (node.kind == ts.SyntaxKind.PropertyAccessExpression) {
    return guessName((<ts.PropertyAccessExpression>node).name);
  } else if (node.kind == ts.SyntaxKind.Identifier) {
    return (<ts.Identifier>node).text;
  }
  return undefined;
}
