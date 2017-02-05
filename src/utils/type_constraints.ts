import * as ts from "typescript";
import * as fl from "./flags";
import {Options} from "../options";

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
};

export class CallConstraints {
  constructor(
      private createConstraints: () => TypeConstraints,
      public readonly returnType: TypeConstraints = createConstraints(),
      public readonly argTypes: TypeConstraints[] = []) {}

  get hasChanges() {
    return this.returnType.hasChanges || this.argTypes.some(c => c.hasChanges);
  }
  clearHasChanges() {
    this.returnType.clearHasChanges();
    this.argTypes.forEach(c => c.clearHasChanges());
  }
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
  private types: ts.Type[] = [];
  private _flags: ts.TypeFlags = 0;
  private _isBooleanLike = false;
  private _isNumberOrString = false;

  private _hasChanges = false;
  // private _isBuilding = true;

  constructor(
      private services: ts.LanguageService,
      private checker: ts.TypeChecker,
      private options: Options,
      initialType?: ts.Type) {
    if (initialType) {
      this.isType(initialType);
      this.clearHasChanges();
    }
    // this._isBuilding = false;
  }

  get flags() {
    return this._flags;
  }

  private createConstraints(initialType?: ts.Type): TypeConstraints {
    return new TypeConstraints(this.services, this.checker, this.options, initialType);
  }

  get isPureFunction(): boolean {
    return this.callConstraints != null &&
        !this._isBooleanLike &&
        !this._isNumberOrString &&
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
    if (fl.isAny(type)) {
      return;
    }

    if (fl.isUnion(type)) {
      for (const member of (<ts.UnionType>type).types) {
        this.isType(member);
      }
      if (type.flags === ts.TypeFlags.Union) {
        // Nothing else in this union type.
        return;
      }
    }

    this.types.push(type);
      // const baseTypes = type.getBaseTypes();
      // if (baseTypes)
      // console.log(`BASE types: ${baseTypes.length}`);

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
      const decls = prop.getDeclarations();
      if (decls == null || decls.length == 0) {
        // Declaration is outside the scope of the compilation (maybe, builtin JS types).
        // console.warn(`Property ${this.checker.symbolToString(prop)} has no known declaration`);
        continue;
      }
      this.getFieldConstraints(this.checker.symbolToString(prop))
         .isType(this.checker.getTypeOfSymbolAtLocation(prop, decls[0]));
    }

    this.hasFlags(type.flags);

    // const after = this.resolve();
    // console.log(`isType(${this.checker.typeToString(type)}): "${before}" -> "${after}`);
  }

  private hasFlags(flags: ts.TypeFlags) {
    flags = fl.normalize(flags);

    const oldFlags = this._flags;
    const newFlags = oldFlags | flags;
    if (newFlags != this._flags) {
      this._flags = newFlags;
      this.markChange();
    }
  }
  
  hasCallConstraints(): boolean {
    return !!this.callConstraints;
  }
  getCallConstraints(): CallConstraints {
    this.isObject();
    if (!this.callConstraints) {
      this.callConstraints = new CallConstraints(() => this.createConstraints());
    }
    return this.callConstraints;
  }
  
  isNumber() {
    this.hasFlags(ts.TypeFlags.Number);
  }
  isString() {
    this.hasFlags(ts.TypeFlags.String);
  }
  isObject() {
    this.hasFlags(ts.TypeFlags.Object);
  }
  isNullable() {
    this.hasFlags(ts.TypeFlags.Null);
  }
  isVoid() {
    this.hasFlags(ts.TypeFlags.Void);
  }
  isBooleanLike() {
    if (this._isBooleanLike || fl.isBoolean(this._flags) || fl.isBooleanLike(this._flags) ||
        fl.isNullOrUndefined(this._flags) || fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isBooleanLike = true;
    this.markChange();
  }
  isNumberOrString() {
    if (this._isNumberOrString || fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isNumberOrString = true;
    this.markChange();
    // this.hasFlags(ts.TypeFlags.StringOrNumberLiteral);
  }

  private markChange() {
    if (this._hasChanges) return;

    // const typeNames = this.types.map(t => this.checker.typeToString(t)).join(', ');
    this._hasChanges = true;
  }

  get hasChanges() {
    if (this._hasChanges) {
      return true;
    }
    for (const c of this.fields.values()) {
      if (c.hasChanges) {
        this._hasChanges = true;
        return true;
      }
    }
    if (this.callConstraints && this.callConstraints.hasChanges) {
      this._hasChanges = true;
      return true;
    }
    return false;
  }

  clearHasChanges() {
    this._hasChanges = false;
    for (const c of this.fields.values()) {
      c.clearHasChanges();
    }
    if (this.callConstraints) {
      this.callConstraints.clearHasChanges();
    }
  }

  private typeToString(t: ts.Type | null): string | null {
    return t == null ? null : this.checker.typeToString(t);
  }
  private argsListToString(types: string[]): string {
    return types.map((t, i) => `arg${i + 1}: ${t || 'any'}`).join(', ');
  }

  resolveCallableArgListAndReturnType(): [string, string] | undefined {
    // const isUndefined = fl.isUndefined(constraints.flags);
    //     // console.log(`isUndefined(${name}) = ${isUndefined} (Flags = ${constraints.flags})`);
    //     const resolved = constraints.resolve({ignoreFlags: isUndefined ? ts.TypeFlags.Undefined : 0});
        
    return this.callConstraints && 
      [
          this.argsListToString(
              this.callConstraints.argTypes.map(c => c.resolve() || 'any')),
          this.callConstraints.returnType.resolve() || 'any'
      ];
  }

  normalize() {
    let flags = this._flags;

    // let fieldsToRemove = new Set([...this.fields.keys()]);
    function removeFields(names: string[]) {
      names.forEach(n => this.fields.remove(n));
    }
    if (fl.isString(flags)) {
      removeFields(Object.keys(String.prototype));
    }
    
    const fieldNames = [...this.fields.keys()];
    const allFieldsAreStringMembers = fieldNames.every(k => k in String.prototype);
    const allFieldsAreArrayMembers = fieldNames.every(k => k in Array.prototype);

    // Make boolean yield to string and number, as they both fulfil the same bool-like purpose.
    // TODO: avoid overwriting literal booleans (which are erased during flag normalization)
    if (fl.isBoolean(flags) && (fl.isString(flags) || fl.isNumber(flags))) {
      flags &= ~ts.TypeFlags.Boolean;
    }

    if (allFieldsAreStringMembers && 
        (!allFieldsAreArrayMembers || this._isBooleanLike || fl.isBoolean(flags) || fl.isBooleanLike(flags)) &&
        fieldNames.length >= this.options.methodThresholdAfterWhichAssumeString) {
      this._isNumberOrString = false;
      flags &= ~ts.TypeFlags.Boolean;
      flags |= ts.TypeFlags.String;
      this.fields.clear();
    }
      
    if (this._isNumberOrString || fl.isNumber(flags) || fl.isString(flags)) {
    // if (this._isNumberOrString) {
      this._isNumberOrString = false;

      if (fieldNames.length > 0 && allFieldsAreStringMembers) {
        flags |= ts.TypeFlags.String;
        this.fields.clear();
      } else if (!fl.isNumber(flags) && !fl.isString(flags)) {
        flags |= ts.TypeFlags.String | ts.TypeFlags.Number;
      }
    }
    if (this._isBooleanLike) {
      this._isBooleanLike = false;
      if (!fl.isNumber(flags) && !fl.isBoolean(flags) && !fl.isString(flags) && !fl.isNullOrUndefined(flags)) {
        if (fl.isObject(flags) || fl.isStructuredType(flags)) {
          flags |= ts.TypeFlags.Undefined;
        } else {
          flags |= ts.TypeFlags.Boolean;
        }
      }
    }
    this._flags = flags;
  }

  resolve({ignoreFlags}: {ignoreFlags?: ts.TypeFlags} = {}): string | null {
    this.normalize();

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
      constraints.normalize();

      if (constraints.isPureFunction) {
        const [argList, retType] = constraints!.resolveCallableArgListAndReturnType()!;
        members.push(`${name}(${argList}): ${retType}`);
      } else {
        const isUndefined = fl.isUndefined(constraints.flags);
        // console.log(`isUndefined(${name}) = ${isUndefined} (Flags = ${constraints.flags})`);
        const resolved = constraints.resolve({ignoreFlags: isUndefined ? ts.TypeFlags.Undefined : 0});
        members.push(`${name}${isUndefined ? '?' : ''}: ${resolved || 'any'}`);
      }
    }

    // for (const type of this.types) {
    //   union.push(this.checker.typeToString(type));
    // }

    // const typesFlags = this.types.reduce((flags, type) => flags | type.flags, 0);
    // const missingFlags = this._flags & ~typesFlags;
    let flags = this._flags;
    if (ignoreFlags) {
      flags &= ~ignoreFlags;
    }
    for (const primitive in primitivePredicates) {
      if (primitivePredicates[primitive](flags)) {
        union.push(primitive);
      }
    }
    if (members.length > 0) {
      union.push('{' + members.join(', ') + '}');
      // union.push('{ ' + members.map(m => m + ';').join(' ') + ' }');
    }

    // Skip void if there's any other type.
    if (union.length == 0 && fl.isVoid(flags)) {
      union.push('void');
    }
    const result = union.length == 0 ? null : union.join(' | ');
    // console.log(`result = "${result}" (members = [${members}], types = [${this.types.map(t => this.checker.typeToString(t))}], flags = ${this._flags}, missingFlags = ${missingFlags}`);
    return result;
  }
}

const primitivePredicates = {
    'number': fl.isNumber,
    'string': fl.isString,
    'boolean': fl.isBoolean,
    'null': fl.isNull,
    'undefined': fl.isUndefined,
};