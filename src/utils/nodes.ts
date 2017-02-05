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

export function findParentOfKind(node: ts.Node, ...kinds: ts.SyntaxKind[]) {
    let parent = node.parent;
    while (parent) {
        if (isAnyKind(parent, ...kinds)) {
            return parent;
        }
        parent = parent.parent;
    }
    return undefined;
}

export function isAnyKind(node: ts.Node, ...kinds: ts.SyntaxKind[]) {
    return kinds.indexOf(node.kind) >= 0;
}

export function getNodeKindDebugDescription(node: ts.Node) {
    return Object.keys(ts.SyntaxKind).find(k => ts.SyntaxKind[k] == node.kind);
}