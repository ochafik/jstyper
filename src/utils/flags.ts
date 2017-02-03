import * as ts from "typescript";

function flagsTester(...flagss: ts.TypeFlags[]): (testee: ts.Type | ts.TypeFlags) => boolean {
  return (testee) => {
    let testeeFlags = typeof testee == 'number' ? testee : testee.flags;
    return flagss.some(flags => (testeeFlags & flags) == flags);
  }
}

export const isAny = flagsTester(ts.TypeFlags.Any);
export const isBoolean = flagsTester(ts.TypeFlags.Boolean, ts.TypeFlags.BooleanLiteral);
export const isNumber = flagsTester(ts.TypeFlags.Number, ts.TypeFlags.NumberLiteral);
export const isString = flagsTester(ts.TypeFlags.String, ts.TypeFlags.StringLiteral);
export const isStructuredType = flagsTester(ts.TypeFlags.StructuredType);
export const isVoid = flagsTester(ts.TypeFlags.Void);