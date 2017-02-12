import * as ts from 'typescript';
export * from './node_predicates';
import * as nodes from './node_predicates';

export function traverse(root: ts.Node, f: (node: ts.Node) => void): void {
  ts.forEachChild(root, visit);
  function visit(node: ts.Node) {
    f(node);
    ts.forEachChild(node, visit);
  }
}

export function isCallTarget(n: ts.Node): boolean {
  if (n.parent && nodes.isCallExpression(n.parent)) {
    const call = <ts.CallExpression>n.parent;
    return call.expression === n;
  }
  return false;
}

export function findParent(
    node: ts.Node, predicate: (parent: ts.Node) => boolean) {
  let parent = node.parent;
  while (parent) {
    if (predicate(parent)) {
      return parent;
    }
    parent = parent.parent;
  }
  return undefined;
}

export function getNodeKindDebugDescription(node: ts.Node) {
  return Object.keys(ts.SyntaxKind).find(k => ts.SyntaxKind[k] == node.kind);
}
