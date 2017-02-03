import * as ts from 'typescript';

export function traverse(root: ts.Node, f: (node: ts.Node) => void): void {
  ts.forEachChild(root, visit);
  function visit(node: ts.Node) {
    f(node);
    ts.forEachChild(node, visit);
  }
}

export function isCallTarget(n: ts.Node): boolean {
    if (n.parent && n.parent.kind == ts.SyntaxKind.CallExpression) {
      const call = <ts.CallExpression>n.parent;
      return call.expression === n;
    }
    return false;
}
