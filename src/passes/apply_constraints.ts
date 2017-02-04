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
      const decls = sym.getDeclarations();
      if (!decls || decls.length == 0) {
          continue;
      }
      let [decl] = decls;
      
      if (decl.kind == ts.SyntaxKind.Parameter || decl.kind == ts.SyntaxKind.VariableDeclaration) {
        handleVarConstraints(constraints, <ts.ParameterDeclaration | ts.VariableDeclaration>decl)
      } else if (decl.kind === ts.SyntaxKind.FunctionDeclaration) {
        const fun = <ts.FunctionDeclaration>decl;
        const callConstraints = constraints.getCallConstraints();
        if (callConstraints) {
            callConstraints.argTypes.forEach((argConstraints, i) => {
                const param = fun.parameters[i];
                handleVarConstraints(argConstraints, param);
            });
        }
      }

      function handleVarConstraints(constraints: TypeConstraints, varDecl: ts.ParameterDeclaration | ts.VariableDeclaration) {

        const resolved = constraints.resolve();
        const initial = constraints.initialType && checker.typeToString(constraints.initialType);
        if (resolved == null || resolved == initial) {
            return;
        }
        
        if (varDecl.type) {
            const start = varDecl.type.getStart();
            const length = varDecl.type.getEnd() - start;
            //  console.log(`REPLACING "${varDecl.type.getFullText()}"
            //     resolved: "${resolved}"
            //      initial: "${initial}"
            //      length: ${length}
            //   fullWidth: ${varDecl.type.getFullWidth()}`);

            addChange(decl.getSourceFile().fileName, {
                span: {
                    start: start,
                    length: length
                },
                newText: resolved
            });
        } else {
            addChange(decl.getSourceFile().fileName, {
                span: {
                    start: varDecl.name.getEnd(),
                    length: 0
                },
                newText: ': ' + resolved
            });
        }
      }
  }
}
