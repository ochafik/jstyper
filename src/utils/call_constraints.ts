import * as ts from 'typescript';

import * as nodes from './nodes';
import * as fl from './flags';
import {guessName} from './name_guesser';
import {TypeConstraints} from './type_constraints';

export type Signature = {
  returnType?: ts.Type,
  argTypes: ts.Type[]
};

export class CallConstraints {
  private minArity: number|undefined;
  private _constructible = false;
  private _hasChanges = false;

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

  isConstructible(markChanges = false) {
    if (this._constructible) return;
    this._constructible = true;
    if (markChanges) {
      this._hasChanges = true;
    }
  }

  hasSignature(sig: ts.Signature, markChanges = true) {
    const decl = sig.getDeclaration();
    if (!decl) {
      return;
    }
    const params = decl.parameters;
    const paramTypes = params.map(p => this.checker.getTypeAtLocation(p));

    this.returnType.isType(sig.getReturnType(), markChanges);

    let minArity = 0;
    for (let paramType of paramTypes) {
      if (fl.isUndefined(paramType.flags)) {
        break;
      }
      minArity++;
    }
    this.hasArity(minArity, markChanges);

    paramTypes.forEach((paramType, i) => {
      const param = params[i];
      const paramConstraints = this.getArgType(i, markChanges);
      paramConstraints.isType(paramType, markChanges);
      paramConstraints.addName(guessName(param.name));
    });
  }
  
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