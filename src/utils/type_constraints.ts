import * as ts from 'typescript';

import {Options} from '../options';
import * as nodes from './nodes';

import * as fl from './flags';
import {guessName} from './name_guesser';

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
};

export class CallConstraints {
  // private arities: number[] = [];
  private minArity: number|undefined;

  constructor(
      private calleeDescription: string,
      private createConstraints: (description: string) => TypeConstraints,
      public readonly returnType:
          TypeConstraints = createConstraints(`${calleeDescription}.return`),
      public readonly argTypes: TypeConstraints[] = []) {}

  get hasChanges() {
    return this.returnType.hasChanges || this.argTypes.some(c => c.hasChanges);
  }
  // clearHasChanges() {
  //   this.returnType.clearHasChanges();
  //   this.argTypes.forEach(c => c.clearHasChanges());
  // }
  private ensureArity(arity: number, markChanges: boolean = true) {
    let updated = false;
    for (let i = 0; i < arity; i++) {
      if (this.argTypes.length <= i) {
        this.argTypes.push(this.createConstraints(
            `${this.calleeDescription}.arguments[${i}]`));
        updated = true;
      }
    }

    if (updated) {
      this.updateOptionalArgs(markChanges);
    }
  }
  hasArity(arity: number, markChanges: boolean = true) {
    // this.arities.push(arity);
    if (typeof this.minArity === 'undefined' || arity < this.minArity) {
      this.minArity = arity;
      this.updateOptionalArgs(markChanges);
    }
  }
  getArgType(index: number, markChanges: boolean = true) {
    this.ensureArity(index + 1, markChanges);
    return this.argTypes[index];
  }
  private updateOptionalArgs(markChanges: boolean = true) {
    if (typeof this.minArity === 'undefined') {
      return;
    }
    this.argTypes.forEach((t, i) => {
      if (i >= this.minArity) {
        t.isUndefined(markChanges);
      }
    });
  }
};

export class TypeConstraints {
  private fields = new Map<string, TypeConstraints>();
  private callConstraints?: CallConstraints;
  // private types: ts.Type[] = [];
  private symbols: ts.Symbol[] = [];
  private names: Set<string>|undefined;
  private nameHints: Set<string>|undefined;
  private _flags: ts.TypeFlags = 0;
  private _isBooleanLike = false;
  private _isNumberOrString = false;
  private _cannotBeVoid = false;
  private _isWritable = false;

  private _hasChanges = false;
  // private _isBuilding = true;

  constructor(
      public readonly description: string, private services: ts.LanguageService,
      private checker: ts.TypeChecker, private options: Options,
      initialType?: ts.Type) {
    if (initialType) {
      this.isType(initialType);
      // this.clearHasChanges();
    }
    // console.log(`TypeConstraints: ${description}`);
    // this._isBuilding = false;
  }

  get fieldNames(): string[] {
    return [...this.fields.keys()];
  }

  addName(name?: string) {
    if (!name) return;
    (this.names = this.names || new Set()).add(name);
  }
  addNameHint(name?: string) {
    if (!name) return;
    (this.nameHints = this.nameHints || new Set()).add(name);
  }

  get flags() {
    return this._flags;
  }

  private createConstraints(description: string, initialType?: ts.Type):
      TypeConstraints {
    return new TypeConstraints(
        description, this.services, this.checker, this.options, initialType);
  }

  get isPureFunction(): boolean {
    return this.callConstraints != null && !this._isBooleanLike &&
        !this._isNumberOrString && (this._flags === ts.TypeFlags.Object) &&
        // !this._isWritable &&
        this.fields.size == 0;
  }

  getFieldConstraints(name: string, markChanges: boolean = true):
      TypeConstraints {
    this.isObject(markChanges);
    let constraints = this.fields.get(name);
    if (!constraints) {
      constraints = this.createConstraints(`${this.description}.${name}`);
      if (markChanges) {
        constraints.markChange();
      }
      this.fields.set(name, constraints);
    }
    return constraints;
  }

  isType(type: ts.Type, markChanges: boolean = true) {
    // {
    //   let tpe = type && this.checker.typeToString(type);
    //   console.log(`Constraints(${this.description}).isType(${tpe})`);
    // }

    // const name = this.checker.typeToString(type);
    if (!type || fl.isAny(type)) {
      if (markChanges && !this._flags && this.symbols.length == 0) {
        this.markChange();
      }
      return;
    }

    if (type.flags & ts.TypeFlags.Object && type.symbol &&
        type.symbol.flags &
            (ts.SymbolFlags.Class | ts.SymbolFlags.Enum |
             ts.SymbolFlags.ConstEnum | ts.SymbolFlags.Interface |
             ts.SymbolFlags.Alias | ts.SymbolFlags.TypeAlias |
             ts.SymbolFlags.TypeParameter)) {
      // console.log(`GOT SYMBOL ${this.checker.symbolToString(ft.symbol)}`);
      if (this.symbols.indexOf(type.symbol) >= 0) {
        return;
      }
      this.symbols.push(type.symbol);
      if (markChanges) {
        this.markChange();
      }
      markChanges = false;
    }

    const originalHasChanges = this._hasChanges;

    if (fl.isUnion(type)) {
      for (const member of (<ts.UnionType>type).types) {
        this.isType(member, markChanges);
      }
      if (type.flags === ts.TypeFlags.Union) {
        // Nothing else in this union type.
        return;
      }
    }

    // this.types.push(type);

    // function isType(c: TypeConstraints, t: ts.Type) {
    //   if (isNamedSymbol) {
    //     const hadChanges = c.hasChanges;
    //     c.isType(t);
    //     if (!hadChanges) {
    //       c.clearHasChanges();
    //     }
    //   } else {
    //     c.isType(t);
    //   }
    // }

    for (const sig of type.getCallSignatures()) {
      const params = sig.getDeclaration().parameters;
      const callConstraints = this.getCallConstraints(markChanges);

      const paramTypes = params.map(p => this.checker.getTypeAtLocation(p));

      callConstraints.returnType.isType(sig.getReturnType(), markChanges);

      let minArity = 0;
      for (let paramType of paramTypes) {
        if (fl.isUndefined(paramType.flags)) {
          break;
        }
        minArity++;
      }
      callConstraints.hasArity(minArity, markChanges);

      paramTypes.forEach((paramType, i) => {
        const param = params[i];
        const paramConstraints = callConstraints!.getArgType(i, markChanges);
        paramConstraints.isType(paramType, markChanges);
        paramConstraints.addName(guessName(param.name));
      });
    }
    for (const prop of type.getProperties()) {
      const decls = prop.getDeclarations();
      if (decls == null || decls.length == 0) {
        // Declaration is outside the scope of the compilation (maybe, builtin
        // JS types).
        // console.warn(`Property ${this.checker.symbolToString(prop)} has no
        // known declaration`);
        continue;
      }
      const fieldConstraints = this.getFieldConstraints(this.checker.symbolToString(prop), markChanges);
      
      for (const decl of decls) {
        const type = this.checker.getTypeOfSymbolAtLocation(prop, decl);
        if (//(prop.flags & ts.SymbolFlags.SetAccessor) ||
            !nodes.isReadonly(decl)) {
          fieldConstraints.isWritable(markChanges);
        }
        if (nodes.isPropertySignature(decl) && decl.questionToken) {
          fieldConstraints.isUndefined();
        }
        fieldConstraints.isType(type, markChanges);
      }
    }

    this.hasFlags(type.flags, markChanges);

    if (!markChanges) {
      this._hasChanges = originalHasChanges;
    }
    // const after = this.resolve();
    // console.log(`isType(${this.checker.typeToString(type)}): "${before}" ->
    // "${after}`);
  }

  private hasFlags(flags: ts.TypeFlags, markChanges: boolean = true) {
    flags = fl.normalize(flags);

    const oldFlags = this._flags;
    const newFlags = oldFlags | flags;
    if (newFlags != this._flags) {
      this._flags = newFlags;
      if (markChanges) {
        this.markChange();
      }
    }
  }

  hasCallConstraints(): boolean {
    return !!this.callConstraints;
  }

  getCallConstraints(markChanges: boolean = true): CallConstraints {
    this.isObject(markChanges);
    if (!this.callConstraints) {
      this.callConstraints = new CallConstraints(
          this.description, (d) => this.createConstraints(d));
    }
    return this.callConstraints;
  }

  isNumber(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Number, markChanges);
  }
  isString(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.String, markChanges);
  }
  isUndefined(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Undefined, markChanges);
  }
  isObject(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Object, markChanges);
  }
  isNullable(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Null, markChanges);
  }
  isVoid(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Void, markChanges);
  }
  
  get writable(): boolean {
    return this._isWritable;
  }
  isWritable(markChanges: boolean = true) {
    if (this._isWritable) return;
    this._isWritable = true;
    if (markChanges) {
      this.markChange();
    }
  }
  cannotBeVoid(markChanges: boolean = true) {
    if (this._cannotBeVoid) return;

    this._cannotBeVoid = true;
    if (markChanges) {
      this.markChange();
    }
  }
  isBooleanLike(markChanges: boolean = true) {
    if (this._isBooleanLike || fl.isBoolean(this._flags) ||
        fl.isBooleanLike(this._flags) || fl.isNullOrUndefined(this._flags) ||
        fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isBooleanLike = true;
    if (markChanges) {
      this.markChange();
    }
  }
  isNumberOrString(markChanges: boolean = true) {
    if (this._isNumberOrString || fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isNumberOrString = true;
    if (markChanges) {
      this.markChange();
    }
    // this.hasFlags(ts.TypeFlags.StringOrNumberLiteral);
  }

  private markChange() {
    if (this._hasChanges) return;

    // const typeNames = this.types.map(t =>
    // this.checker.typeToString(t)).join(', ');
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

  // clearHasChanges() {
  //   this._hasChanges = false;
  //   for (const c of this.fields.values()) {
  //     c.clearHasChanges();
  //   }
  //   if (this.callConstraints) {
  //     this.callConstraints.clearHasChanges();
  //   }
  // }

  private typeToString(t: ts.Type|null): string|null {
    return t == null ? null : this.checker.typeToString(t);
  }

  resolveMaybeUndefined(): {resolved: string | null, isUndefined: boolean} {
    this.normalize();
    const isUndefined = fl.isUndefined(this.flags);

    // console.log(`isUndefined(${name}) = ${isUndefined} (Flags =
    // ${constraints.flags})`);
    const resolved =
        this.resolve({ignoreFlags: isUndefined ? ts.TypeFlags.Undefined : 0});
    return {resolved: resolved, isUndefined: isUndefined};
  }

  private resolveKeyValueDecl(name: string, valueType: TypeConstraints, {isMember}: {isMember?: boolean} = {}):
      string {
    valueType.normalize();
    let {isUndefined, resolved} = valueType.resolveMaybeUndefined();
    resolved = resolved || 'any';
    if (isUndefined) {
      return `${name}?: ${resolved}`;
    } else {
      if (valueType._isWritable || !isMember) {
        return `${name}: ${resolved}`;
      } else {
        return `readonly ${name}: ${resolved}`;
        // return `get ${name}(): ${resolved}`;
      }
    }
  }

  get bestName(): string|undefined {
    if (this.names) {
      for (const name of this.names) {
        return name;
      }
    }
    if (this.nameHints) {
      const hints = [...this.nameHints.values()];
      const camelSplit =
          hints.map(n => n.replace(/([a-z](?=[A-Z]))/g, '$1 ').toLowerCase());
      // TODO: tokenize camel-case instead of this crude test.
      return hints.find((h, i) => {
        const cs = camelSplit[i];
        return camelSplit.every((cs2, ii) => i == ii || cs2.endsWith(cs));
      });
    }
    return undefined;
  }

  resolveCallableArgListAndReturnType(): [string, string]|undefined {
    // const isUndefined = fl.isUndefined(constraints.flags);
    //     // console.log(`isUndefined(${name}) = ${isUndefined} (Flags =
    //     ${constraints.flags})`);
    //     const resolved = constraints.resolve({ignoreFlags: isUndefined ?
    //     ts.TypeFlags.Undefined : 0});

    return this.callConstraints && [
      this.callConstraints.argTypes
          .map((t, i) => {
            const name = t.bestName || `arg${i + 1}`;
            return this.resolveKeyValueDecl(name, t, {isMember: false});
          })
          .join(', '),
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
    const allFieldsAreStringMembers =
        fieldNames.every(k => k in String.prototype);
    const allFieldsAreArrayMembers =
        fieldNames.every(k => k in Array.prototype);

    // TODO: avoid overwriting literal booleans (which are erased during flag
    // normalization)
    if (fl.isBoolean(flags)) {
      if (fl.isNullOrUndefined(flags)) {
        flags &= ~(ts.TypeFlags.Null | ts.TypeFlags.Undefined);
      }
      // Make boolean yield to string and number, as they both fulfil the same
      // bool-like purpose.
      if (fl.isString(flags) || fl.isNumber(flags)) {
        flags &= ~ts.TypeFlags.Boolean;
      }
    }

    if (allFieldsAreStringMembers &&
        (!allFieldsAreArrayMembers || this._isBooleanLike ||
         fl.isBoolean(flags) || fl.isBooleanLike(flags)) &&
        fieldNames.length >=
            this.options.methodThresholdAfterWhichAssumeString) {
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
      if (!fl.isNumber(flags) && !fl.isBoolean(flags) && !fl.isString(flags) &&
          !fl.isNullOrUndefined(flags)) {
        if (fl.isObject(flags) || fl.isStructuredType(flags)) {
          flags |= ts.TypeFlags.Undefined;
        } else {
          flags |= ts.TypeFlags.Boolean;
        }
      }
    }
    if (this._cannotBeVoid) {
      this._cannotBeVoid = false;
      flags &= ~ts.TypeFlags.Void;
    }
    this._flags = flags;
  }

  resolve({ignoreFlags}: {ignoreFlags?: ts.TypeFlags} = {}): string|null {
    this.normalize();

    if (fl.isAny(this.flags)) {
      return 'any';
    }

    const union: string[] = [];
    const members: string[] = [];

    if (this.callConstraints) {
      let [argList, retType] = this.resolveCallableArgListAndReturnType()!;
      retType = retType || 'any';
      if (retType.indexOf(' ') >= 0) {
        retType = `(${retType})`;
      }

      const sigSig = `(${argList})${retType}`;
      if (this.fields.size > 0) {
        members.push(`(${argList}): ${retType}`)
      } else {
        union.push(`(${argList}) => ${retType}`);
      }
    }

    for (const sym of this.symbols) {
      union.push(this.checker.symbolToString(sym));
    }

    for (const [name, constraints] of this.fields) {
      if (!constraints.hasChanges) {
        // console.log(`NO CHANGE for ${constraints.description}`);
        continue;
      }
      constraints.normalize();

      if (constraints.isPureFunction) {
        const [argList, retType] =
            constraints!.resolveCallableArgListAndReturnType()!;
        members.push(`${name}(${argList}): ${retType}`);
      } else {
        members.push(this.resolveKeyValueDecl(name, constraints, {isMember: true}));
      }
    }

    // for (const type of this.types) {
    //   union.push(this.checker.typeToString(type));
    // }

    // const typesFlags = this.types.reduce((flags, type) => flags | type.flags,
    // 0);
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
    const result = union.length == 0 ? null : union.map(u => u.indexOf(' ') < 0 || union.length == 1 ? u : `(${u})`).join(' | ');
    // console.log(`result = "${result}" (members = [${members}], types =
    // [${this.types.map(t => this.checker.typeToString(t))}], flags =
    // ${this._flags}, missingFlags = ${missingFlags}`);
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