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
export const isBooleanLike = flagsTester(ts.TypeFlags.Boolean, ts.TypeFlags.BooleanLiteral, ts.TypeFlags.BooleanLike);
export const isNull = flagsTester(ts.TypeFlags.Null);
export const isNumber = flagsTester(ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral);
export const isNumberOrString = flagsTester(
    ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral,
    ts.TypeFlags.String, ts.TypeFlags.StringLiteral,
    ts.TypeFlags.StringOrNumberLiteral);
export const isString = flagsTester(ts.TypeFlags.String, ts.TypeFlags.StringLiteral);
export const isStructuredType = flagsTester(ts.TypeFlags.StructuredType);
export const isVoid = flagsTester(ts.TypeFlags.Void);

export const isPrimitive = flagsTester(
    ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral,
    ts.TypeFlags.String, ts.TypeFlags.StringLiteral,
    ts.TypeFlags.StringOrNumberLiteral,
    ts.TypeFlags.Boolean, ts.TypeFlags.BooleanLiteral)