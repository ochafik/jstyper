import * as ts from "typescript";

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
  // argTypesAndNames: [ts.Type, string[]][]
};

export type CallableConstraints = {
  returnType: TypeConstraints,
  argTypes: TypeConstraints[],
};

export class TypeConstraints {
  private fields = new Map<string, TypeConstraints>();
  private types: ts.Type[] = [];
  private callConstraints?: CallableConstraints;
  private flags: ts.TypeFlags = 0;

  constructor(
      private services: ts.LanguageService,
      private checker: ts.TypeChecker,
      public initialType?: ts.Type) {
    if (initialType) {
      this.isType(initialType);
    }
  }

  private createConstraints(initialType?: ts.Type): TypeConstraints {
    return new TypeConstraints(this.services, this.checker, initialType);
  }

  getFieldConstraints(name: string): TypeConstraints {
    let constraints = this.fields.get(name);
    if (!constraints) {
      this.fields.set(name, constraints = this.createConstraints());
    }
    return constraints;
  }

  isType(type: ts.Type) {
    // type.
    // if (type.flags & ts.TypeFlags.Any) {
    //   return;
    // }
    if (type.flags & ts.TypeFlags.NumberLiteral) {
      this.isNumber();
      return;
    }
    const sym = type.getSymbol();
    if (sym && sym.getName() != '__type') {
      // console.log(`SYMBOL(${this.checker.typeToString(type)}) = ${sym && this.checker.symbolToString(sym)}`);
      this.types.push(type);
      return;
    }
    for (const sig of type.getCallSignatures()) {
      const params = sig.getDeclaration().parameters;
      const callConstraints = this.getCallConstraints(params.length);
      callConstraints.returnType.isType(sig.getReturnType());

      params.forEach((param, i) => {
        const paramType = this.checker.getTypeAtLocation(param);
        callConstraints!.argTypes[i].isType(paramType);
      });
    }
    for (const prop of type.getProperties()) {
      this.getFieldConstraints(this.checker.symbolToString(prop))
        .isType(this.checker.getTypeOfSymbolAtLocation(prop, prop.getDeclarations()[0]));
    }
    this.flags |= type.flags;
    // this.types.push(type);
  }
  
  private getCallConstraints(arity: number): CallableConstraints {
    if (!this.callConstraints) {
      this.callConstraints = {
        returnType: this.createConstraints(),
        argTypes: []
      };
    }
    for (let i = 0; i < arity; i++) {
      if (this.callConstraints!.argTypes.length <= i) {
        this.callConstraints!.argTypes.push(this.createConstraints());
      }
    }
    return this.callConstraints;
  }

  isCallable(sig: Signature) {
    const callConstraints = this.getCallConstraints(sig.argTypes.length);
    if (sig.returnType) {
      callConstraints.returnType.isType(sig.returnType);
    }
    sig.argTypes.forEach((t, i) => callConstraints.argTypes[i].isType(t));
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
  private argsListToString(types: string[]): string {
    return types.map((t, i) => `arg${i + 1}: ${t || 'any'}`).join(', ');
  }

  resolve(): string | null {
    const union: string[] = [];
    const members: string[] = [];

    for (const [name, constraints] of this.fields) {
      members.push(`${name}: ${constraints.resolve() || 'any'}`);
    }

    // const signaturesSeen = new Set<string>();
    if (this.callConstraints) {
      const argList = this.argsListToString(
          this.callConstraints.argTypes.map(c => c.resolve() || 'any'));
      
      const retType = this.callConstraints.returnType.resolve() || 'any';

      const sigSig = `(${argList})${retType}`;
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
    // console.log(`result = "${result}" (members = [${members}], types = [${this.types.map(t => this.checker.typeToString(t))}], flags = ${this.flags}, missingFlags = ${missingFlags}`);
    return result;
  }
}
