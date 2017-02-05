import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import * as fl from "../utils/flags";
import * as ops from '../utils/operators';
import {Options} from '../options';

// TODO: check if a constraint has seen any new info, then as long as some do, do our own loop to avoid writing files.
export function applyConstraints(allConstraints: Map<ts.Symbol, TypeConstraints>, checker: ts.TypeChecker, addChange: AddChangeCallback) {
  for (const [sym, constraints] of allConstraints) {
      if (!constraints.hasChanges) {
        //   console.log(`No changes for symbol ${checker.symbolToString(sym)}`);
          continue;
      }
      const decls = sym.getDeclarations();
      if (!decls || decls.length == 0) {
          continue;
      }
      let [decl] = decls;
      
      if (decl.kind == ts.SyntaxKind.Parameter || decl.kind == ts.SyntaxKind.VariableDeclaration) {
        handleVarConstraints(constraints, <ts.ParameterDeclaration | ts.VariableDeclaration>decl)
      } else if (decl.kind === ts.SyntaxKind.FunctionDeclaration) {
        const fun = <ts.FunctionDeclaration>decl;
        if (constraints.hasCallConstraints()) {
            const callConstraints = constraints.getCallConstraints();
            callConstraints.argTypes.forEach((argConstraints, i) => {
                const param = fun.parameters[i];
                if (param) {
                    handleVarConstraints(argConstraints, param);
                }
            });
            handleReturnType(callConstraints.returnType, fun);
        }
      }

      function handleReturnType(constraints: TypeConstraints, fun: ts.FunctionDeclaration) {
            if (!constraints.hasChanges) {
                return;
            }
          const resolved = constraints.resolve();
            if (!resolved) {
                return;
            }
            let start: number;
            let length: number;
            let pre: string;
            if (fun.type) {
                start = fun.type.getStart();
                length = fun.type.getEnd() - start;
                pre = '';
            } else {
                if (fun.body) {
                    start = fun.body.getStart() - 1;
                } else {
                    start = fun.end;
                }
                length = 0;
                pre = ': ';
            }
            addChange(fun.getSourceFile().fileName, {
                span: {
                    start: start,
                    length: length
                },
                newText: pre + resolved
            });
      }

      function handleVarConstraints(constraints: TypeConstraints, varDecl: ts.ParameterDeclaration | ts.VariableDeclaration) {
          if (!constraints.hasChanges) {
              return;
          }
        // const resolved = constraints.resolve();
        const {isUndefined, resolved} = constraints.resolveMaybeUndefined();
        if (resolved == null) {
            // console.log(`No changes for var ${varDecl.getFullText()}: ${resolved}`);
            return;
        }

        const start = varDecl.name.getEnd();
        let length: number;
        let pre = isUndefined ? '?: ' : ': ';
        
        if (varDecl.type) {
            length = varDecl.type.getEnd() - start;
        } else {
            length = 0;
        }
        addChange(decl.getSourceFile().fileName, {
            span: {
                start: start,
                length: length
            },
            newText: pre + resolved
        });
      }
  }
}
