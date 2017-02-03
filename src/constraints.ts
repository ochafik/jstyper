import * as ts from "typescript";

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
  // argTypesAndNames: [ts.Type, string[]][]
};

export class CallConstraints {
  constructor(
      private createConstraints: () => TypeConstraints,
      public readonly returnType: TypeConstraints = createConstraints(),
      public readonly argTypes: TypeConstraints[] = []) {}

  private ensureArity(arity: number) {
    for (let i = 0; i < arity; i++) {
      if (this.argTypes.length <= i) {
        this.argTypes.push(this.createConstraints());
      }
    }
  }
  getArgType(index: number) {
    this.ensureArity(index + 1);
    return this.argTypes[index];
  }
};

export class TypeConstraints {
  private fields = new Map<string, TypeConstraints>();
  private types: ts.Type[] = [];
  private callConstraints?: CallConstraints;
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

  get isPureFunction(): boolean {
    return this.callConstraints != null &&
        this.flags == 0 &&
        this.fields.size == 0 &&
        this.types.length == 0;
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
      const callConstraints = this.getCallConstraints();
      callConstraints.returnType.isType(sig.getReturnType());

      params.forEach((param, i) => {
        const paramType = this.checker.getTypeAtLocation(param);
        callConstraints!.getArgType(i).isType(paramType);
      });
    }
    for (const prop of type.getProperties()) {
      this.getFieldConstraints(this.checker.symbolToString(prop))
        .isType(this.checker.getTypeOfSymbolAtLocation(prop, prop.getDeclarations()[0]));
    }
    this.flags |= type.flags;
  }
  
  getCallConstraints(): CallConstraints {
    if (!this.callConstraints) {
      this.callConstraints = new CallConstraints(() => this.createConstraints());
    }
    return this.callConstraints;
  }
  
  isNumber() {
    this.flags |= ts.TypeFlags.Number;
  }
  isNullable() {
    this.flags |= ts.TypeFlags.Null;
  }
  isVoid() {
    this.flags |= ts.TypeFlags.Void;
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

  resolveCallableArgListAndReturnType(): [string, string] | undefined {
    return this.callConstraints && 
      [
          this.argsListToString(
              this.callConstraints.argTypes.map(c => c.resolve() || 'any')),
          this.callConstraints.returnType.resolve() || 'any'
      ];
  }

  resolve(): string | null {
    const union: string[] = [];
    const members: string[] = [];

    for (const [name, constraints] of this.fields) {
      if (constraints.isPureFunction) {
        const [argList, retType] = constraints!.resolveCallableArgListAndReturnType()!;
        members.push(`${name}(${argList}): ${retType}`);
      } else {
        members.push(`${name}: ${constraints.resolve() || 'any'}`);
      }
    }

    // const signaturesSeen = new Set<string>();
    if (this.callConstraints) {
      const [argList, retType] = this.resolveCallableArgListAndReturnType()!;

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

    // Skip void if there's any other type.
    if (union.length == 0 && (missingFlags & ts.TypeFlags.Void)) {
      union.push('void');
    }
    const result = union.length == 0 ? null : union.join(' | ');
    // console.log(`result = "${result}" (members = [${members}], types = [${this.types.map(t => this.checker.typeToString(t))}], flags = ${this.flags}, missingFlags = ${missingFlags}`);
    return result;
  }
}
