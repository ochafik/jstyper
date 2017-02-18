import * as ts from 'typescript';

import {Options} from '../options';
import * as nodes from './nodes';

import * as fl from './flags';
import {CallConstraints} from './call_constraints';
export {CallConstraints};

export class TypeConstraints {
  fields = new Map<string, TypeConstraints>();
  computedFields = new Map<string, TypeConstraints>();

  // private constructConstraints?: CallConstraints;
  private _callConstraints?: CallConstraints;
  private symbols: ts.Symbol[] = [];
  private names: Set<string>|undefined;
  private nameHints: Set<string>|undefined;
  private _flags: ts.TypeFlags = 0;
  private _isBooleanLike = false;
  private _isSymbol = false;
  private _isNumberOrString = false;
  private _cannotBeVoid = false;
  private _isWritable = false;

  private _hasChanges = false;

  constructor(
      public readonly description: string, private services: ts.LanguageService,
      private checker: ts.TypeChecker, private options: Options,
      initialType?: ts.Type) {
    if (initialType) {
      this.isType(initialType);
    }
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
    return this._callConstraints != null &&
        //!this._callConstraints.constructible &&
        !this._isBooleanLike &&
        !this._isSymbol &&
        !this._isNumberOrString && (this._flags === ts.TypeFlags.Object) &&
        // this.constructConstraints == null &&
        // !this._isWritable &&
        this.fields.size == 0 &&
        this.computedFields.size == 0;
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

  getComputedFieldConstraints(name: string, markChanges: boolean = true):
      TypeConstraints {
    if (!this.options.differentiateComputedProperties) {
      return this.getFieldConstraints(name, markChanges);
    }

    this.isObject(markChanges);
    let constraints = this.computedFields.get(name);
    if (!constraints) {
      constraints = this.createConstraints(`${this.description}['${name}']`);
      if (markChanges) {
        constraints.markChange();
      }
      this.computedFields.set(name, constraints);
    }
    return constraints;
  }

  isType(type: ts.Type, markChanges: boolean = true, isReadonly = false, andNotFlags?: ts.TypeFlags) {
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

    const flags = typeof andNotFlags === 'undefined' ? type.flags : type.flags & ~andNotFlags;

    if (flags & ts.TypeFlags.Object && type.symbol &&
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
        this.isType(member, markChanges, isReadonly, andNotFlags);
      }
      if (flags === ts.TypeFlags.Union) {
        // Nothing else in this union type.
        return;
      }
    }

    for (const sig of type.getCallSignatures()) {
      const cc = this.getCallConstraints(markChanges);
      cc.hasSignature(sig, markChanges);
    }

    for (const sig of type.getConstructSignatures()) {
      const cc = this.getCallConstraints(markChanges);
      cc.hasSignature(sig, markChanges);
      cc.isConstructible(markChanges);
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
      // const fieldConstraints = this.getFieldConstraints(this.checker.symbolToString(prop), markChanges);
      
      for (const decl of decls) {
//         if (!nodes.isPropertySignature(decl) &&
//             !nodes.isPropertyDeclaration(decl) &&
//             !nodes.isGetAccessor(decl) &&
//             !nodes.isSetAccessor(decl) &&
//             !nodes.isMethodDeclaration(decl)) {
//           continue;
//         }
        //const name = this.checker.symbolToString(prop);
        let name: string | undefined;
        let fieldConstraints: TypeConstraints | undefined;
        if (nodes.isComputedPropertyName(decl.name)) {
          if (nodes.isStringLiteral(decl.name.expression)) {
            name = decl.name.expression.text;
            fieldConstraints = this.getComputedFieldConstraints(name, markChanges);
          }
        } else {
          name = this.checker.symbolToString(prop);
          fieldConstraints = this.getFieldConstraints(name, markChanges);
        }
        if (!name || !fieldConstraints) {
          continue;
        }
      
        const type = this.checker.getTypeOfSymbolAtLocation(prop, decl);
        if (!isReadonly &&//(prop.flags & ts.SymbolFlags.SetAccessor) ||
            !nodes.isReadonly(decl)) {
          fieldConstraints.isWritable(markChanges);
        }
        if (nodes.isPropertySignature(decl) && decl.questionToken) {
          fieldConstraints.isUndefined(markChanges);
        }
        fieldConstraints.isType(type, markChanges);
      }
    }

    this.hasFlags(flags, markChanges);

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

  get hasCallConstraints(): boolean {
    return !!this._callConstraints;
  }

  // get hasConstructConstraints(): boolean {
  //   return !!this.constructConstraints;
  // }

  getCallConstraints(markChanges: boolean = true): CallConstraints {
    this.isObject(markChanges);
    if (!this._callConstraints) {
      this._callConstraints = new CallConstraints(
          this.checker, this.description,
          (d) => this.createConstraints(`${this.description}.call.${d}`));
    }
    return this._callConstraints;
  }

  // getConstructConstraints(markChanges: boolean = true): CallConstraints {
  //   this.isObject(markChanges);
  //   if (!this.constructConstraints) {
  //     this.constructConstraints = new CallConstraints(
  //         this.checker, this.description,
  //         (d) => this.createConstraints(`${this.description}.new.${d}`));
  //   }
  //   return this.constructConstraints;
  // }

  isNumber(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Number, markChanges);
  }
  isBoolean(markChanges: boolean = true) {
    this.hasFlags(ts.TypeFlags.Boolean, markChanges);
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
    if (this._cannotBeVoid || this._flags & ~ts.TypeFlags.Void) return;

    this._cannotBeVoid = true;
    if (markChanges) {
      this.markChange();
    }
  }
  isSymbol(markChanges: boolean = true) {
    if (this._isSymbol) return;

    this._isSymbol = true;
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
    if ([...this.fields.values(), ...this.computedFields.values()].some(f => f.hasChanges)) {
      this._hasChanges = true;
      return true;
    }
    if (this._callConstraints && this._callConstraints.hasChanges) {
      this._hasChanges = true;
      return true;
    }
    return false;
  }

  resolveMaybeUndefined(): {resolved: string | null, isUndefined: boolean} {
    this.normalize();
    const isUndefined = fl.isUndefined(this.flags);

    const resolved =
        this.resolve({ignoreFlags: isUndefined ? ts.TypeFlags.Undefined : 0});
    return {resolved: resolved, isUndefined: isUndefined};
  }

  private resolveKeyValueDecl(name: string, valueType: TypeConstraints, {isComputed, isMember}: {isComputed?: boolean, isMember?: boolean} = {}):
      string {
    valueType.normalize();
    let {isUndefined, resolved} = valueType.resolveMaybeUndefined();
    resolved = resolved || 'any';

    const key = isComputed ? `['${name}']` : name;
    const prefix = valueType._isWritable || !isMember ? '' : 'readonly ';
    if (isUndefined) {
      return `${prefix}${key}?: ${resolved}`;
    } else {
      return `${prefix}${key}: ${resolved}`;
      // return `get ${key}(): ${resolved}`;
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
      return hints.find((_, i) => {
        const cs = camelSplit[i];
        return camelSplit.every((cs2, ii) => i == ii || cs2.endsWith(cs));
      });
    }
    return undefined;
  }

  resolveCallableArgListAndReturnType(): [string, string]|undefined {
    return this._callConstraints && [
      this._callConstraints.argTypes
          .map((t, i) => {
            const name = t.bestName || `arg${i + 1}`;
            return this.resolveKeyValueDecl(name, t, {isMember: false});
          })
          .join(', '),
      this._callConstraints.returnType.resolve() || 'any'
    ];
  }

  normalize() {
    let flags = this._flags;

    // let fieldsToRemove = new Set([...this.fields.keys()]);
    const removeFields = (names: string[]) => {
      for (const n of names) {
        this.fields.delete(n);
        this.computedFields.delete(n);
      }
    };
    const removeAllFields = () => {
      this.fields.clear();
      this.computedFields.clear();
    };

    if (fl.isString(flags)) {
      removeFields(Object.keys(String.prototype));
    }

    const fieldNames = [...this.fields.keys(), ...this.computedFields.keys()];
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
      removeAllFields();
    }

    if (this._isNumberOrString || fl.isNumber(flags) || fl.isString(flags)) {
      // if (this._isNumberOrString) {
      this._isNumberOrString = false;

      if (fieldNames.length > 0 && allFieldsAreStringMembers) {
        flags |= ts.TypeFlags.String;
        removeAllFields();
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

    if (this._callConstraints) {
      let [argList, retType] = this.resolveCallableArgListAndReturnType()!;
      retType = retType || 'any';
      if (retType.indexOf(' ') >= 0) {
        retType = `(${retType})`;
      }

      // const sigSig = `(${argList})${retType}`;
      const prefix = this._callConstraints.constructible ? 'new' : '';
      if (this.fields.size > 0 || this.computedFields.size > 0) {
        members.push(`${prefix}(${argList}): ${retType}`)
      } else {
        union.push(`${prefix}(${argList}) => ${retType}`);
      }
    }

    for (const sym of this.symbols) {
      union.push(this.checker.symbolToString(sym));
    }

    const handleFields = (fields: Map<string, TypeConstraints>, isComputed: boolean) => {
      for (const [name, constraints] of [...fields].sort(([a], [b]) => a < b ? -1 : 1)) {
        if (!constraints.hasChanges) {
          continue;
        }
        constraints.normalize();

        if (constraints.isPureFunction) {
          const [argList, retType] =
              constraints!.resolveCallableArgListAndReturnType()!;
          members.push(`${isComputed ? `['${name}']` : name}(${argList}): ${retType}`);
        } else {
          members.push(this.resolveKeyValueDecl(name, constraints, {isComputed, isMember: true}));
        }
      }
    };
    handleFields(this.fields, false);
    handleFields(this.computedFields, true);

    let flags = this._flags;
    if (ignoreFlags) {
      flags &= ~ignoreFlags;
    }
    for (const primitive in primitivePredicates) {
      if (primitivePredicates[primitive](flags)) {
        union.push(primitive);
      }
    }
    if (this._isSymbol) {
      union.push('symbol');
    }
    if (members.length > 0) {
      union.push('{' + members.join(', ') + '}');
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