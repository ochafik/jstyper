import * as ts from 'typescript';
import * as fl from './flags';
import * as nodes from './nodes';
import {guessName} from './name_guesser';
import {TypeConstraints, TypeOpts, getTypeOptions} from './type_constraints';

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
};

export class CallConstraints {
  private minArity: number|undefined;
  private _constructible = false;
  private _hasChanges = false;
  private _thisConstraints?: TypeConstraints;

  constructor(
      private checker: ts.TypeChecker,
      private calleeDescription: string,
      private createConstraints: (description: string) => TypeConstraints,
      public readonly returnType:
          TypeConstraints = createConstraints(`${calleeDescription}.return`),
      public readonly argTypes: TypeConstraints[] = []) {}

  get hasChanges() {
    return this._hasChanges || this.returnType.hasChanges || this.argTypes.some(c => c.hasChanges);
  }

  get constructible() {
    return this._constructible;
  }

  isConstructible(opts?: TypeOpts) {
    // markChanges = false
    const typeOptions = getTypeOptions(opts);

    if (this._constructible) return;
    this._constructible = true;
    if (typeOptions.markChanges) {
      this._hasChanges = true;
    }
  }

  hasSignature(sig: ts.Signature, opts?: TypeOpts) {
    const decl = sig.getDeclaration();
    if (!decl) {
      return;
    }
    
    const params: ts.ParameterDeclaration[] = [];
    const paramTypes: ts.Type[] = [];

    decl.parameters.forEach((param, i) => {
      const paramType = this.checker.getTypeAtLocation(param);
      if (i == 0 && nodes.isIdentifier(param.name) && param.name.text == 'this') {//} nodes.isThisType(param)) {
        this.getThisType().isType(paramType);
      } else {
        params.push(param);
        paramTypes.push(paramType);
      }
    });

    this.returnType.isType(sig.getReturnType(), opts);

    let minArity = 0;
    for (let paramType of paramTypes) {
      if (fl.isUndefined(paramType.flags)) {
        break;
      }
      minArity++;
    }
    this.hasArity(minArity, opts);

    paramTypes.forEach((paramType, i) => {
      const param = params[i];
      const paramConstraints = this.getArgType(i, opts);
      paramConstraints.isType(paramType, opts);
      paramConstraints.addName(guessName(param.name));
    });
  }
  
  private ensureArity(arity: number, opts?: TypeOpts) {
    let updated = false;
    for (let i = 0; i < arity; i++) {
      if (this.argTypes.length <= i) {
        this.argTypes.push(this.createConstraints(
            `${this.calleeDescription}.arguments[${i}]`));
        updated = true;
      }
    }

    if (updated) {
      this.updateOptionalArgs(opts);
    }
  }
  hasArity(arity: number, opts?: TypeOpts) {
    // this.arities.push(arity);
    if (typeof this.minArity === 'undefined' || arity < this.minArity) {
      this.minArity = arity;
      this.updateOptionalArgs(opts);
    }
  }

  hasThisType(): boolean {
    return this._thisConstraints != null;
  }

  getThisType(): TypeConstraints {
    if (!this._thisConstraints) {
      this._thisConstraints = this.createConstraints('this');
    }
    return this._thisConstraints;
  }

  getArgType(index: number, opts?: TypeOpts) {
    this.ensureArity(index + 1, opts);
    return this.argTypes[index];
  }
  private updateOptionalArgs(opts?: TypeOpts) {
    if (typeof this.minArity === 'undefined') {
      return;
    }
    this.argTypes.forEach((t, i) => {
      if (typeof this.minArity == 'number' && i >= this.minArity) {
        t.isUndefined(opts);
      }
    });
  }
};