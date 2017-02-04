import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import {isAny, isBoolean, isBooleanLike, isNull, isNumber, isNumberOrString, isPrimitive, isString, isStructuredType} from '../utils/flags';
import * as ops from '../utils/operators';

// TODO: check if a constraint has seen any new info, then as long as some do, do our own loop to avoid writing files.
export const infer: ReactorCallback = (fileNames, services, addChange) => {
  
  const allConstraints = new Map<ts.Symbol, TypeConstraints>();
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
        traverse(sourceFile, (node: ts.Node) => {
            const ctxType = checker.getContextualType(<ts.Expression>node);
            if (ctxType) {//} && !isAny(ctxType)) {
                const tc = getNodeConstraints(node);
                if (tc) {
                    tc.isType(ctxType);
                }
            }

            if (node.kind === ts.SyntaxKind.CallExpression) {
                const call = <ts.CallExpression>node;
                const calleeConstraints = getNodeConstraints(call.expression);

                if (calleeConstraints) {
                    const callConstraints = calleeConstraints.getCallConstraints();
                    
                    let returnType: ts.Type | undefined = ctxType;
                    const argTypes = call.arguments.map(a => checker.getTypeAtLocation(a));
                    
                    if (returnType) {
                        callConstraints.returnType.isType(returnType);
                    } else if (node.parent && node.parent.kind == ts.SyntaxKind.ExpressionStatement) {
                        callConstraints.returnType.isVoid();
                    }
                    // console.log(`CALL(${call.getFullText()}):`);
                    argTypes.forEach((t, i) => {
                        // console.log(`  ARG(${i}): ${checker.typeToString(t)}`);
                        callConstraints!.getArgType(i).isType(t);
                    });
                }
            } else if (node.kind === ts.SyntaxKind.BinaryExpression) {
                const binExpr = <ts.BinaryExpression>node;
                const [[leftType, leftSym], [rightType, rightSym]] = [binExpr.left, binExpr.right].map(typeAndSymbol);
                
                const leftConstraints = getNodeConstraints(binExpr.left);
                const rightConstraints = getNodeConstraints(binExpr.right);

                const op = binExpr.operatorToken.kind;

                if (ops.binaryNumberOperators.has(op)) {
                    if (leftConstraints) {
                        leftConstraints.isNumber();
                    }
                    if (rightConstraints) {
                        rightConstraints.isNumber();
                    }
                } else if (ops.binaryNumberOrStringOperators.has(op)) {
                    if (isNumber(ctxType)) {
                      leftConstraints && leftConstraints.isNumber();
                      rightConstraints && rightConstraints.isNumber();  
                    }
                    // function handlePlusOp(constraints: TypeConstraints | undefined, otherType: ts.Type) {
                    //     if (!constraints) {
                    //         return;
                    //     }
                    //     if (!isString(constraints.flags) && isNumber(otherType)) {
                    //         constraints.isNumber();
                    //     }
                    //     if (!isNumber(constraints.flags) && isString(otherType)) {
                    //         constraints.isString();
                    //     }
                    // }
                    // handlePlusOp(leftConstraints, rightType);
                    // handlePlusOp(rightConstraints, leftType);
                    // if (leftConstraints && isNumberOrString(rightType)) {
                    //     leftConstraints.isNumberOrString();
                    // }
                    // if (rightConstraints && isNumberOrString(leftType)) {
                    //     rightConstraints.isNumberOrString();
                    // }
                } else if (ops.equalityLikeOperators.has(op)) {
                    // This is a bit bold: we assume if things can be equatable, then they have the same type.
                    function handle(constraints: TypeConstraints | undefined, otherType: ts.Type) {
                        if (leftConstraints && otherType) {
                            if (isPrimitive(otherType)) {//!isAny(otherType)) {
                                leftConstraints.isType(otherType);
                            } else if (isNull(otherType)) {
                                leftConstraints.isNullable();
                            }
                        }
                    }
                    handle(leftConstraints, rightType);
                    handle(rightConstraints, leftType);
                }
                if (ops.assignmentOperators.has(op)) {
                    if (op == ts.SyntaxKind.PlusEqualsToken) {
                        if (leftConstraints && isNumber(leftConstraints.flags) && rightConstraints) {
                            rightConstraints.isNumber();
                        }
                        // handlePlusOp(leftConstraints, rightType);
                    } else if (leftConstraints && rightType && !isAny(rightType)) {
                        leftConstraints.isType(rightType);
                    }
                }
            } else if (node.kind === ts.SyntaxKind.PostfixUnaryExpression ||
                node.kind == ts.SyntaxKind.PrefixUnaryExpression) {
              const expr = <ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>node;
              const constraints = getNodeConstraints(expr.operand);
            //   console.log(`leftConstraints for ${node.getFullText()}: ${leftConstraints} (op = ${expr.operator}, ops.unaryNumberOperators = ${[...ops.unaryNumberOperators.values()]})`);
              if (constraints) {
                  if (ops.unaryNumberOperators.has(expr.operator)) {
                      constraints.isNumber();
                  }
              }
            // } else if (node.kind == ts.SyntaxKind.Parameter || node.kind == ts.SyntaxKind.VariableDeclaration) {
            //     const varDecl = <ts.ParameterDeclaration | ts.VariableDeclaration>node;
            //     const varSym = checker.getSymbolAtLocation(varDecl.name);
            //     // console.log(`INIT[${varSym && checker.symbolToString(varSym)}]`);
            //     if (varSym && varDecl.initializer) {
            //         const constraints = getSymbolConstraints(varSym);
            //         const initType = checker.getTypeAtLocation(varDecl.initializer);
            //         // console.log(`INIT[${checker.symbolToString(varSym)}]: ${initType && checker.typeToString(initType)}`);
            //         if (initType) {
            //             constraints.isType(initType);
            //         }
            //     }
            }
        });
    }
  }

  for (const [sym, constraints] of allConstraints) {
      let [decl] = sym.getDeclarations();
      
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
            // const start = varDecl.type.getFirstToken().getStart();
            // const end = varDecl.type.getLastToken().getStart();
            //    replacing: "${decl.getSourceFile().getFullText().slice(start, end)}"
            // console.log(`REPLACING "${varDecl.type.getFullText()}"
            //     resolved: "${resolved}"
            //      initial: "${initial}"`);

            addChange(decl.getSourceFile().fileName, {
                span: {
                    start: start,
                    length: varDecl.type.getEnd() - start
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

  function typeAndSymbol(n: ts.Node): [ts.Type, ts.Symbol] {
    let symbolNode: ts.Node;
    switch (n.kind) {
      case ts.SyntaxKind.Parameter:
        symbolNode = (<ts.ParameterDeclaration>n).name;
        break;
      case ts.SyntaxKind.VariableDeclaration:
        symbolNode = (<ts.VariableDeclaration>n).name;
        break;
      default:
        symbolNode = n;
    }
    return [checker.getTypeAtLocation(n), checker.getSymbolAtLocation(symbolNode)];
  }

  function getSymbolConstraints(sym: ts.Symbol): TypeConstraints {
    let constraints = allConstraints.get(sym);
    if (!constraints) {
        const decls = sym.getDeclarations();
        let type: ts.Type | undefined;
        if (decls.length > 0) {
          type = checker.getTypeOfSymbolAtLocation(sym, decls[0]);
        }
        constraints = new TypeConstraints(services, checker, type && !isAny(type) ? type : undefined);
        allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  function getNodeConstraints(node: ts.Node): TypeConstraints | undefined {
    if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
        const access = <ts.PropertyAccessExpression>node;
        const constraints = getNodeConstraints(access.expression);
        if (constraints) {
            return constraints.getFieldConstraints(access.name.text);
        }
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
        let constraints = getNodeConstraints((<ts.CallExpression>node).expression);
        if (constraints) {
            return constraints.getCallConstraints().returnType;
        }
    } else if (node.kind === ts.SyntaxKind.Identifier) {
        const sym = checker.getSymbolAtLocation(node);
        if (sym) {
            return getSymbolConstraints(sym);
        }
    }
    return undefined;
  }
}
