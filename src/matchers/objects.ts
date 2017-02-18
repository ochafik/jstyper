import * as ts from 'typescript';
import * as nodes from '../utils/nodes';

type MatchedPropertyDescriptor = {
  writable: boolean,
  valueTypes: ts.Type[]
};

type MatchedObjectLiteralElement = {
  name: string,
  isComputedName: boolean,
  value: ts.Node
}

type MatchedPropertyDescriptors = {
  target: ts.Node,
  properties: (MatchedPropertyDescriptor & {name: string, isComputedName: boolean})[]
};

export function getKeyValue(node: ts.ObjectLiteralElement): MatchedObjectLiteralElement | undefined {
  let value: ts.Node;
  if (nodes.isShorthandPropertyAssignment(node)) {
    value = node.objectAssignmentInitializer || node.name;
  } else if (nodes.isPropertyAssignment(node)) {
    value = node.initializer;
  } else {
    return undefined;
  }

  let name: string;
  let isComputedName: boolean;
  if (nodes.isIdentifier(node.name)) {
    name = node.name.text;
    isComputedName = false;
  } else if (nodes.isStringLiteral(node.name)) {
    name = node.name.text;
    isComputedName = true;
  } else if (nodes.isComputedPropertyName(node.name) && nodes.isStringLiteral(node.name.expression)) {
    name = node.name.expression.text;
    isComputedName = true;
  } else {
    return undefined;
  }
  return { name, isComputedName, value };
}

export function matchProperties(node: ts.Node, checker: ts.TypeChecker): MatchedPropertyDescriptors | undefined {
  if (isSimpleStaticCall(node, 'Object', 'defineProperty', 3)) {
    const [target, name, desc] = node.arguments;
    if (nodes.isStringLiteral(name) && nodes.isObjectLiteralExpression(desc)) {
      return {
        target,
        properties: [{
          name: name.text,
          isComputedName: true,

          ...matchPropertyDescriptor(desc, checker)
        }]
      };
    }
  } else if (isSimpleStaticCall(node, 'Object', 'defineProperties', 2)) {
    const [target, descs] = node.arguments;
    if (nodes.isObjectLiteralExpression(descs)) {
      const ret: MatchedPropertyDescriptors = {
        target,
        properties: []
      };
      for (const prop of descs.properties) {
        const kv = getKeyValue(prop);
        if (!kv) continue;

        const {name, isComputedName, value} = kv;
        if (nodes.isObjectLiteralExpression(value)) {
          ret.properties.push({
            name,
            isComputedName,
            ...matchPropertyDescriptor(value, checker)
          });
        }
      }
      return ret;
    }
  }
  return undefined;
}

function isSimpleStaticCall(node: ts.Node, className: string, methodName: string, arity: number): node is ts.CallExpression {
  return nodes.isCallExpression(node) &&
      nodes.isPropertyAccessExpression(node.expression) &&
      nodes.isIdentifier(node.expression.expression) &&
      node.expression.expression.text == className &&
      node.expression.name.text == methodName &&
      (arity === void 0 || node.arguments.length == arity);
}

function matchPropertyDescriptor(desc: ts.ObjectLiteralExpression, checker: ts.TypeChecker): MatchedPropertyDescriptor {
  let writable = false;
  const valueTypes: ts.Type[] = [];

  for (const prop of desc.properties) {
    const kv = getKeyValue(prop);
    if (!kv) continue;

    const {name, value} = kv;
    switch (name) {
      case 'writable':
        writable = !nodes.isFalseKeyword(value);
        break;
      case 'get':
        const getterType = value && checker.getTypeAtLocation(value);
        if (getterType) {
          for (const sig of getterType.getCallSignatures()) {
            valueTypes.push(sig.getReturnType());
          }
        }
        break;
      case 'set':
        writable = true;
        break;
      case 'value':
        const valueType = value && checker.getTypeAtLocation(value);
        if (valueType) {
          valueTypes.push(valueType);
        }
        break;
    }
  }

  return {
    writable,
    valueTypes,
  };
}
