import * as ts from 'typescript';

import {Options} from '../options';
import * as nodes from './nodes';
import * as objects from '../matchers/objects';
import * as fl from './flags';
import {CallConstraints} from './call_constraints';
export {CallConstraints};

export type TypeOptions = {
  markChanges: boolean,
  isReadonly: boolean,
  andNotFlags: ts.TypeFlags
};

export type TypeOpts = Partial<Readonly<TypeOptions>>;

export const defaultTypeOptions: Readonly<TypeOptions> = {
  markChanges: true,
  isReadonly: false,
  andNotFlags: 0
};

export function getTypeOptions(opts?: TypeOpts, defaults = defaultTypeOptions): Readonly<TypeOptions> {
  return opts ? {...defaults, ...opts} : defaultTypeOptions; 
}

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

  getFieldConstraints({name, isNameComputed}: {name: string, isNameComputed: boolean}, opts?: TypeOpts):
      TypeConstraints {

    const computed = isNameComputed && this.options.differentiateComputedProperties;
    const map = computed ? this.computedFields : this.fields;

    this.isObject(opts);
    let constraints = map.get(name);
    if (!constraints) {
      constraints = this.createConstraints(`${this.description}${computed ? `['${name}']` : `.${name}`}`);
      constraints.markChange(opts);
      map.set(name, constraints);
    }
    return constraints;
  }

  isType(type: ts.Type, opts?: TypeOpts) {
    let typeOptions = getTypeOptions(opts);
    
    if (!type || fl.isAny(type)) {
      if (typeOptions.markChanges && !this._flags && this.symbols.length == 0) {
        this.markChange();
      }
      return;
    }

    const flags = type.flags & ~typeOptions.andNotFlags;
    
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
      if (typeOptions.markChanges) {
        this.markChange();
      }
      typeOptions = {...typeOptions, markChanges: false};
    }

    // const originalHasChanges = this._hasChanges;

    if (fl.isUnion(type)) {
      for (const member of (<ts.UnionType>type).types) {
        this.isType(member, typeOptions);
      }
      if (flags === ts.TypeFlags.Union) {
        // Nothing else in this union type.
        return;
      }
    }

    for (const sig of type.getCallSignatures()) {
      const cc = this.getCallConstraints(typeOptions);
      cc.hasSignature(sig, typeOptions);
    }

    for (const sig of type.getConstructSignatures()) {
      const cc = this.getCallConstraints(typeOptions);
      cc.hasSignature(sig, typeOptions);
      cc.isConstructible(typeOptions);
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
        let matchedName = decl.name && objects.matchDeclarationName(decl.name);
        if (!matchedName) {
          continue;
        }

        let fieldConstraints = this.getFieldConstraints(matchedName, typeOptions);
      
        const type = this.checker.getTypeOfSymbolAtLocation(prop, decl);
        if (!typeOptions.isReadonly &&//(prop.flags & ts.SymbolFlags.SetAccessor) ||
            !nodes.isReadonly(decl)) {
          fieldConstraints.isWritable(typeOptions);
        }
        if (nodes.isPropertySignature(decl) && decl.questionToken) {
          fieldConstraints.isUndefined(typeOptions);
        }
        fieldConstraints.isType(type, typeOptions);
      }
    }

    this.hasFlags(flags, typeOptions);

    // if (!markChanges) {
    //   this._hasChanges = originalHasChanges;
    // }
    // const after = this.resolve();
    // console.log(`isType(${this.checker.typeToString(type)}): "${before}" ->
    // "${after}`);
  }

  private hasFlags(flags: ts.TypeFlags, opts?: TypeOpts) {
    flags = fl.normalize(flags);

    const oldFlags = this._flags;
    const newFlags = oldFlags | flags;
    if (newFlags != this._flags) {
      this._flags = newFlags;
      this.markChange(opts);
    }
  }

  get hasCallConstraints(): boolean {
    return !!this._callConstraints;
  }

  getCallConstraints(opts?: TypeOpts): CallConstraints {
    this.isObject(opts);
    if (!this._callConstraints) {
      this._callConstraints = new CallConstraints(
          this.checker, `${this.description}.call`,
          (d) => this.createConstraints(d));//`${this.description}.call.${d}`));
    }
    return this._callConstraints;
  }

  isNumber(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Number, opts);
  }
  isBoolean(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Boolean, opts);
  }
  isString(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.String, opts);
  }
  isUndefined(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Undefined, opts);
  }
  isObject(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Object, opts);
  }
  isNullable(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Null, opts);
  }
  isVoid(opts?: TypeOpts) {
    this.hasFlags(ts.TypeFlags.Void, opts);
  }
  
  get writable(): boolean {
    return this._isWritable;
  }
  isWritable(opts?: TypeOpts) {
    if (this._isWritable) return;
    this._isWritable = true;
    this.markChange(opts);
  }
  cannotBeVoid(opts?: TypeOpts) {
    if (this._cannotBeVoid || this._flags & ~ts.TypeFlags.Void) return;

    this._cannotBeVoid = true;
    this.markChange(opts);
  }
  isSymbol(opts?: TypeOpts) {
    if (this._isSymbol) return;

    this._isSymbol = true;
    this.markChange(opts);
  }
  isBooleanLike(opts?: TypeOpts) {
    if (this._isBooleanLike || fl.isBoolean(this._flags) ||
        fl.isBooleanLike(this._flags) || fl.isNullOrUndefined(this._flags) ||
        fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isBooleanLike = true;
    this.markChange(opts);
  }
  isNumberOrString(opts?: TypeOpts) {
    if (this._isNumberOrString || fl.isNumberOrString(this._flags)) {
      return;
    }
    this._isNumberOrString = true;
    this.markChange(opts);
    // this.hasFlags(ts.TypeFlags.StringOrNumberLiteral);
  }

  private markChange(opts?: TypeOpts) {
    const options = getTypeOptions(opts);
    if (!options.markChanges) return;
    
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