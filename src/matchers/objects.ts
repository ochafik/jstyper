import * as ts from 'typescript';
import * as nodes from '../utils/nodes';

export type MatchedPropertyDescriptor = {
  writable: boolean,
  valueTypes: ts.Type[]
};

type MatchedObjectLiteralElement = {
  name: string,
  isNameComputed: boolean,
  value: ts.Node
}

type MatchedPropertyDescriptors = {
  properties: (MatchedPropertyDescriptor & {name: string, isNameComputed: boolean})[]
};

export type MatchedDeclarationName = {name: string, isNameComputed: boolean};
export function matchDeclarationName(node?: ts.DeclarationName): MatchedDeclarationName | undefined {
  if (!node) return undefined;
  
  let name: string;
  let isNameComputed: boolean;
  if (nodes.isIdentifier(node)) {
    name = node.text;
    isNameComputed = false;
  } else if (nodes.isStringLiteral(node)) {
    name = node.text;
    isNameComputed = true;
  } else if (nodes.isComputedPropertyName(node) && nodes.isStringLiteral(node.expression)) {
    name = node.expression.text;
    isNameComputed = true;
  } else {
    return undefined;
  }
  return {name, isNameComputed};
}

export function getKeyValue(node: ts.ObjectLiteralElement): MatchedObjectLiteralElement | undefined {
  let value: ts.Node;
  if (nodes.isShorthandPropertyAssignment(node)) {
    value = node.objectAssignmentInitializer || node.name;
  } else if (nodes.isPropertyAssignment(node)) {
    value = node.initializer;
  } else {
    return undefined;
  }

  const matchedName = matchDeclarationName(node.name);
  return matchedName && { ...matchedName, value };
}

export function matchPropertyDescriptors(descs: ts.ObjectLiteralExpression, checker: ts.TypeChecker): MatchedPropertyDescriptors | undefined {
  if (nodes.isObjectLiteralExpression(descs)) {
    const ret: MatchedPropertyDescriptors = {
      properties: []
    };
    for (const prop of descs.properties) {
      const kv = getKeyValue(prop);
      if (!kv) continue;

      const {name, isNameComputed, value} = kv;
      if (nodes.isObjectLiteralExpression(value)) {
        ret.properties.push({
          name,
          isNameComputed,
          ...matchPropertyDescriptor(value, checker)
        });
      }
    }
    return ret;
  }
  return undefined;
}

type MatchedSimpleSelect = {
  targetName: string,
  selectedName: string
};

export function matchSimpleSelect(node: ts.Node): MatchedSimpleSelect | undefined {
  if (nodes.isPropertyAccessExpression(node) && nodes.isIdentifier(node.expression)) {
    const targetName = node.expression.text;
    const selectedName = node.name.text;
    return {targetName, selectedName};
  }
  return undefined;
}

export function matchPropertyDescriptor(desc: ts.ObjectLiteralExpression, checker: ts.TypeChecker): MatchedPropertyDescriptor {
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
