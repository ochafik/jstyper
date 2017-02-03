import * as ts from "typescript";

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
  // argTypesAndNames: [ts.Type, string[]][]
};

export class TypeConstraints {
  private fields = new Map<string, TypeConstraints>();
  private types: ts.Type[] = [];
  private callableSignatures: Signature[] = [];
  private flags: ts.TypeFlags = 0;

  constructor(
      private services: ts.LanguageService,
      private checker: ts.TypeChecker,
      initialType?: ts.Type) {
    if (initialType) {
      this.types.push(initialType);
    }
  }

  getFieldConstraints(name: string): TypeConstraints {
    let constraints = this.fields.get(name);
    if (!constraints) {
      this.fields.set(name, constraints = new TypeConstraints(this.services, this.checker));
    }
    return constraints;
  }

  isType(type: ts.Type) {
    // type.
    if (type.flags & ts.TypeFlags.Any) {
      return;
    }
    const callSignatures = type.getCallSignatures();
    if (callSignatures.length > 0) {
      for (const sig of callSignatures) {
        this.callableSignatures.push({
          argTypes: sig.getDeclaration().parameters.map(p => this.checker.getTypeAtLocation(p)),
          returnType: sig.getReturnType()
        });
      }
      return;
    }
    this.types.push(type);
  }
  isCallable(sig: Signature) {
    this.callableSignatures.push(sig);
  }
  // hasField(name: string, type: ts.Type) {
  //   this.getFieldConstraints(name).isType(type);
  // }
  // hasMethod(name: string, sig: Signature) {
  //   this.getFieldConstraints(name).isCallable(sig);
  // }
  isNumber() {
    this.flags |= ts.TypeFlags.Number;
  }
  isNullable() {
    this.flags |= ts.TypeFlags.Null;
  }
  isBooleanLike() {
    this.flags |= ts.TypeFlags.BooleanLike;
  }

  private typeToString(t: ts.Type | null): string | null {
    return t == null ? null : this.checker.typeToString(t);
  }
  private argsListToString(types: ts.Type[]): string {
    return types.map((t, i) => `arg${i + 1}: ${this.typeToString(t) || 'any'}`).join(', ');
  }

  resolve(): string | null {
    const union: string[] = [];
    const members: string[] = [];

    for (const [name, constraints] of this.fields) {
      members.push(`${name}: ${constraints.resolve() || 'any'}`);
    }
    for (const sig of this.callableSignatures) {
      const argList = this.argsListToString(sig.argTypes);
      const retType = sig.returnType ? this.typeToString(sig.returnType) : 'void';
      if (members.length > 0) {
        members.push(`(${argList}): ${retType}`)
      } else {
        union.push(`(${argList}) => ${retType}`);
      }
    }
    for (const type of this.types) {
      union.push(this.checker.typeToString(type));
    }
    const typesFlags = this.types.reduce((flags, type) => flags | type.flags, 0);
    const missingFlags = this.flags & ~typesFlags;
    if (missingFlags & ts.TypeFlags.Number) {
      union.push('number');
    }
    if (missingFlags & ts.TypeFlags.Null) {
      union.push('null');
    } else if (missingFlags & ts.TypeFlags.BooleanLike) {
      union.push('boolean');
    }
    if (members.length > 0) {
      union.push('{' + members.join(', ') + '}');
    }
    const result = union.length == 0 ? null : union.join(' | ');
    console.log(`result = "${result}" (members = [${members}], types = [${this.types.map(t => this.checker.typeToString(t))}], flags = ${this.flags}, missingFlags = ${missingFlags}`);
    return result;
  }
}
