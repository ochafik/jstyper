import * as ts from 'typescript';

export function isUnion(type?: ts.Type): type is ts.UnionType {
  return type != null && (type.flags & ts.TypeFlags.Union) != 0;
}

export function isIntersection(type?: ts.Type): type is ts.IntersectionType {
  return type != null && (type.flags & ts.TypeFlags.Intersection) != 0;
}

export function isLiteral(type?: ts.Type): type is ts.LiteralType {
  return type != null && (type.flags & ts.TypeFlags.Literal) != 0;
}

export function isEnum(type?: ts.Type): type is ts.EnumType {
  return type != null && (type.flags & ts.TypeFlags.Enum) != 0;
}

export function isEnumLiteral(type?: ts.Type): type is ts.EnumLiteralType {
  return type != null && (type.flags & ts.TypeFlags.EnumLiteral) != 0;
}

export function isObject(type?: ts.Type): type is ts.ObjectType {
  return type != null && (type.flags & ts.TypeFlags.Object) != 0;
}

export function isClass(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Class) != 0;
}
export function isInterface(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Interface) != 0;
}

export function isReference(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Reference) != 0;
}
export function isTuple(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Tuple) != 0;
}
export function isAnonymous(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Anonymous) != 0;
}
export function isMapped(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Mapped) != 0;
}
export function isInstantiated(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.Instantiated) != 0;
}
export function isObjectLiteral(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.ObjectLiteral) != 0;
}
export function isEvolvingArray(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.EvolvingArray) != 0;
}
export function isObjectLiteralPatternWithComputedProperties(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.ObjectLiteralPatternWithComputedProperties) != 0;
}
export function isNonPrimitive(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.NonPrimitive) != 0;
}
export function isClassOrInterface(type?: ts.Type): type is ts.ObjectType {
  return isObject(type) && (type.objectFlags & ts.ObjectFlags.ClassOrInterface) != 0;
}

// export function isClassOrInterface(type?: ts.Type): type is ts.InterfaceType {
//   return type != null && (type.flags & (ts.TypeFlags.Class | ts.TypeFlags.Interface)) != 0;
// }
