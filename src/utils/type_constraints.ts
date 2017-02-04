import * as ts from "typescript";
import {isAny, isBoolean, isBooleanLike, isNull, isNumber, isNumberOrString, isString, isStructuredType, isVoid} from '../utils/flags';

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
  private callConstraints?: CallConstraints;
  private _flags: ts.TypeFlags = 0;

  constructor(
      private services: ts.LanguageService,
      private checker: ts.TypeChecker,
      public initialType?: ts.Type) {
    if (initialType) {
      this.isType(initialType);
    }
  }

  get flags() {
    return this._flags;
  }

  private createConstraints(initialType?: ts.Type): TypeConstraints {
    return new TypeConstraints(this.services, this.checker, initialType);
  }

  get isPureFunction(): boolean {
    return this.callConstraints != null &&
        (this._flags & ts.TypeFlags.Object) === ts.TypeFlags.Object &&
        this.fields.size == 0;
  }

  getFieldConstraints(name: string): TypeConstraints {
    this.isObject();
    let constraints = this.fields.get(name);
    if (!constraints) {
      this.fields.set(name, constraints = this.createConstraints());
    }
    return constraints;
  }

  isType(type: ts.Type) {
    // const before = this.resolve();
    // if (type.flags & ts.TypeFlags.NumberLiteral) {
    //   this.isNumber();
    //   return;
    // }
    // const sym = type.getSymbol();
    // if (sym && sym.getName() != '__type') {
    //   console.log(`SYMBOL(${this.checker.typeToString(type)}) = ${sym && this.checker.symbolToString(sym)}`);
    //   this.types.push(type);
    //   return;
    // }
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
    this._flags |= type.flags;

    // const after = this.resolve();
    // console.log(`isType(${this.checker.typeToString(type)}): "${before}" -> "${after}`);
  }
  
  getCallConstraints(): CallConstraints {
    this.isObject();
    if (!this.callConstraints) {
      this.callConstraints = new CallConstraints(() => this.createConstraints());
    }
    return this.callConstraints;
  }
  
  isNumber() {
    this._flags |= ts.TypeFlags.Number;
  }
  isString() {
    this._flags |= ts.TypeFlags.String;
  }
  isNumberOrString() {
    this._flags |= ts.TypeFlags.StringOrNumberLiteral;
  }
  isObject() {
    this._flags |= ts.TypeFlags.Object;
  }
  isNullable() {
    this._flags |= ts.TypeFlags.Null;
  }
  isVoid() {
    this._flags |= ts.TypeFlags.Void;
  }
  isBooleanLike() {
    this._flags |= ts.TypeFlags.BooleanLike;
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

    if (this.callConstraints) {
      const [argList, retType] = this.resolveCallableArgListAndReturnType()!;

      const sigSig = `(${argList})${retType}`;
      if (this.fields.size > 0) {
        members.push(`(${argList}): ${retType}`)
      } else {
        union.push(`(${argList}) => ${retType}`);
      }
    }

    for (const [name, constraints] of this.fields) {
      if (constraints.isPureFunction) {
        const [argList, retType] = constraints!.resolveCallableArgListAndReturnType()!;
        members.push(`${name}(${argList}): ${retType}`);
      } else {
        members.push(`${name}: ${constraints.resolve() || 'any'}`);
      }
    }


    // for (const type of this.types) {
    //   union.push(this.checker.typeToString(type));
    // }

    // const typesFlags = this.types.reduce((flags, type) => flags | type.flags, 0);
    // const missingFlags = this._flags & ~typesFlags;
    const flags = this._flags;
    if (isNumberOrString(flags) && !isNumber(flags) && !isString(flags)) {
      union.push('number');
      union.push('string');
    } else {
      if (isNumber(flags)) {
        union.push('number');
      }
      if (isString(flags)) {
        union.push('string');
      }
    }
    if (isNull(flags)) {
      union.push('null');
    } else if (isBooleanLike(flags)) {
      union.push('boolean');
    }
    if (members.length > 0) {
      // union.push('{' + members.join(', ') + '}');
      union.push('{ ' + members.map(m => m + ';').join(' ') + ' }');
    }

    // Skip void if there's any other type.
    if (union.length == 0 && isVoid(flags)) {
      union.push('void');
    }
    const result = union.length == 0 ? null : union.join(' | ');
    // console.log(`result = "${result}" (members = [${members}], types = [${this.types.map(t => this.checker.typeToString(t))}], flags = ${this._flags}, missingFlags = ${missingFlags}`);
    return result;
  }
}
