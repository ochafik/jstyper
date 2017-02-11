import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import * as nodes from '../utils/nodes';
import * as fl from "../utils/flags";
import * as ops from '../utils/operators';
import {Options} from '../options';

// TODO: check if a constraint has seen any new info, then as long as some do, do our own loop to avoid writing files.
export function applyConstraints(allConstraints: Map<ts.Symbol, TypeConstraints>, checker: ts.TypeChecker, _addChange: AddChangeCallback) {

  function addChange(sourceFile: ts.SourceFile, change: ts.TextChange) {
      if (change.span.length > 0) {
        const source = sourceFile.getFullText();
        const existing = source.substr(change.span.start, change.span.length);
        if (existing == change.newText) {
            return;
        }
      }
      _addChange(sourceFile.fileName, change);
  }
  for (const [sym, constraints] of allConstraints) {
    //   if (!constraints.hasChanges) {
    //     //   console.log(`No changes for symbol ${checker.symbolToString(sym)}`);
    //       continue;
    //   }
      const decls = sym.getDeclarations();
      if (!decls || decls.length == 0) {
          continue;
      }
      let [decl] = decls;
      
      if (decl.kind == ts.SyntaxKind.Parameter || decl.kind == ts.SyntaxKind.VariableDeclaration) {
        handleVarConstraints(constraints, <ts.ParameterDeclaration | ts.VariableDeclaration>decl)
      } else if (nodes.isFunctionLikeDeclaration(decl)) {
        const funDecl = decl;
        if (constraints.hasCallConstraints()) {
            const callConstraints = constraints.getCallConstraints();
            callConstraints.argTypes.forEach((argConstraints, i) => {
                const param = funDecl.parameters[i];
                if (param) {
                    handleVarConstraints(argConstraints, param);
                }
            });
            handleReturnType(callConstraints.returnType, decl);
        }
      }

      function handleReturnType(constraints: TypeConstraints, fun: ts.FunctionLikeDeclaration) {
            // if (!constraints.hasChanges) {
            //     return;
            // }
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
            addChange(fun.getSourceFile(), {
                span: {
                    start: start,
                    length: length
                },
                newText: pre + resolved
            });
      }

      function handleVarConstraints(constraints: TypeConstraints, varDecl: ts.ParameterDeclaration | ts.VariableDeclaration) {
        //   if (!constraints.hasChanges) {
        //       return;
        //   }
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
        addChange(decl.getSourceFile(), {
            span: {
                start: start,
                length: length
            },
            newText: pre + resolved
        });
      }
  }
}
