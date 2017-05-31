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

export function getRequiredPath(node?: ts.Node): string|undefined {
  if (node &&
      nodes.isCallExpression(node) &&
      nodes.isIdentifier(node.expression) &&
      node.expression.text == 'require' &&
      !node.typeArguments &&
      node.arguments.length == 1) {
    const [arg] = node.arguments;
    if (nodes.isStringLiteral(arg)) {
      return arg.text;
    }
  }
  return undefined;
}

export function isReadonly(node: ts.Node): boolean {
  return hasModifier(node, nodes.isReadonlyKeyword);
}

export function isStatic(node: ts.Node): boolean {
  return hasModifier(node, nodes.isStaticKeyword);
}

export function hasModifier(node: ts.Node, predicate: (mod: ts.Modifier) => boolean): boolean {
  return nodes.isPropertySignature(node) && node.modifiers != null && node.modifiers.some(predicate);
}

export function isPrototypeAccess(node: ts.Node): node is ts.PropertyAccessExpression {
  return nodes.isPropertyAccessExpression(node) && node.name.text === 'prototype';
}