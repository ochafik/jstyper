import * as ts from "typescript";

function flagsTester(...flagss: ts.TypeFlags[]): (testee: ts.Type | ts.TypeFlags | undefined) => boolean {
  return (testee) => {
    if (!testee) return false;
    let testeeFlags = typeof testee == 'number' ? testee : testee.flags;
    return flagss.some(flags => (testeeFlags & flags) == flags);
  }
}

export const isAny = flagsTester(ts.TypeFlags.Any);
export const isBoolean = flagsTester(ts.TypeFlags.Boolean, ts.TypeFlags.BooleanLiteral);
export const isBooleanLike = flagsTester(ts.TypeFlags.BooleanLike);
export const isNull = flagsTester(ts.TypeFlags.Null);
export const isNullOrUndefined = flagsTester(ts.TypeFlags.Null, ts.TypeFlags.Undefined);
export const isNumber = flagsTester(ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral);
export const isNumberOrString = flagsTester(
    ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral,
    ts.TypeFlags.String, ts.TypeFlags.StringLiteral,
    ts.TypeFlags.StringOrNumberLiteral);
export const isObject = flagsTester(ts.TypeFlags.String, ts.TypeFlags.Object);
export const isString = flagsTester(ts.TypeFlags.String, ts.TypeFlags.StringLiteral);
export const isStructuredType = flagsTester(ts.TypeFlags.StructuredType);
export const isUndefined = flagsTester(ts.TypeFlags.Undefined);
export const isUnion = flagsTester(ts.TypeFlags.Union);
export const isVoid = flagsTester(ts.TypeFlags.Void);

export const isPrimitive = flagsTester(
    ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral,
    ts.TypeFlags.String, ts.TypeFlags.StringLiteral,
    ts.TypeFlags.StringOrNumberLiteral,
    ts.TypeFlags.Boolean, ts.TypeFlags.BooleanLiteral);

export function normalize(flags: ts.TypeFlags) {
  function replaceFlag(original: ts.TypeFlags, replacement: ts.TypeFlags) {
    if (flags & original) {
      flags = (flags & ~original) | replacement;
    }
  }
  replaceFlag(ts.TypeFlags.BooleanLiteral, ts.TypeFlags.Boolean)
  replaceFlag(ts.TypeFlags.StringLiteral, ts.TypeFlags.String)
  replaceFlag(ts.TypeFlags.NumberLiteral, ts.TypeFlags.Number)
  replaceFlag(ts.TypeFlags.EnumLiteral, ts.TypeFlags.Enum)
  return flags;
}

// export function getFlagsDebugDescription(flags: ts.TypeFlags) {
//     return Object.keys(ts.SyntaxKind).find(k => ts.SyntaxKind[k] == node.kind);
// }