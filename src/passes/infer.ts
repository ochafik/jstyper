import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import * as fl from "../utils/flags";
import * as ops from '../utils/operators';

// TODO: check if a constraint has seen any new info, then as long as some do, do our own loop to avoid writing files.
export const infer: ReactorCallback = (fileNames, services, addChange) => {
  
  const allConstraints = new Map<ts.Symbol, TypeConstraints>();
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
        traverse(sourceFile, (node: ts.Node) => {
            const nodeConstraints = getNodeConstraints(node);
            const ctxType = checker.getContextualType(<ts.Expression>node);
            if (ctxType) {//} && !isAny(ctxType)) {
                if (nodeConstraints) {
                    nodeConstraints.isType(ctxType);
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
                const [leftType, rightType] = [binExpr.left, binExpr.right].map(e => checker.getTypeAtLocation(e));
                
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
                    if (fl.isNumber(ctxType)) {
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
                            if (fl.isPrimitive(otherType)) {//!isAny(otherType)) {
                                leftConstraints.isType(otherType);
                            } else if (fl.isNull(otherType)) {
                                leftConstraints.isNullable();
                            }
                        }
                    }
                    handle(leftConstraints, rightType);
                    handle(rightConstraints, leftType);
                } else if (ops.binaryBooleanOperators.has(op)) {
                    nodeIsBooleanLike(binExpr.left);
                    nodeIsBooleanLike(binExpr.right);
                }
                if (ops.assignmentOperators.has(op)) {
                    if (op == ts.SyntaxKind.PlusEqualsToken) {
                        if (leftConstraints && fl.isNumber(leftConstraints.flags) && rightConstraints) {
                            rightConstraints.isNumber();
                        }
                        // handlePlusOp(leftConstraints, rightType);
                    } else if (leftConstraints && rightType && !fl.isAny(rightType)) {
                        leftConstraints.isType(rightType);
                    }
                }
            } else if (node.kind === ts.SyntaxKind.PostfixUnaryExpression ||
                node.kind == ts.SyntaxKind.PrefixUnaryExpression) {
              const expr = <ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>node;
              const constraints = getNodeConstraints(expr.operand);
            //   console.log(`leftConstraints for ${node.getFullText()}: ${leftConstraints} (op = ${expr.operator}, ops.unaryNumberOperators = ${[...ops.unaryNumberOperators.values()]})`);
              if (constraints) {
                  const op = expr.operator;
                    if (ops.unaryNumberOperators.has(op)) {
                      constraints.isNumber();
                  } else if (ops.unaryBooleanOperators.has(op)) {
                      constraints.isBooleanLike();
                  }
              }
            } else if (node.kind === ts.SyntaxKind.IfStatement) {
              nodeIsBooleanLike((<ts.IfStatement>node).expression);
            } else if (node.kind === ts.SyntaxKind.ConditionalExpression) {
              nodeIsBooleanLike((<ts.ConditionalExpression>node).condition);
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

  function nodeIsBooleanLike(node: ts.Node) {
      const constraints = getNodeConstraints(node);
      if (constraints) {
          constraints.isBooleanLike();
      }
  }

  function getSymbolConstraints(sym: ts.Symbol): TypeConstraints {
    let constraints = allConstraints.get(sym);
    if (!constraints) {
        const decls = sym.getDeclarations();
        let type: ts.Type | undefined;
        if (decls.length > 0) {
          type = checker.getTypeOfSymbolAtLocation(sym, decls[0]);
        }
        constraints = new TypeConstraints(services, checker, type && !fl.isAny(type) ? type : undefined);
        allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  function getNodeConstraints(node: ts.Node): TypeConstraints | undefined {

    while (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
        node = (<ts.ParenthesizedExpression>node).expression;
    }

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
