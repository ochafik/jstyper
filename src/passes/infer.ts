import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import * as fl from "../utils/flags";
import * as ops from '../utils/operators';
import * as nodes from '../utils/nodes';
import {guessName} from '../utils/name_guesser';
import {Options} from '../options';
import {applyConstraints} from './apply_constraints';
import {ConstraintsCache} from './constraints_cache';

export const infer: (options: Options) => ReactorCallback = (options) => (fileNames, services, addChange) => {
  
  const program = services.getProgram();
  const checker = program.getTypeChecker();
  const constraintsCache = new ConstraintsCache(services, options, program, checker);

  function inferOnce() {
    for (const sourceFile of program.getSourceFiles()) {
        if (fileNames.indexOf(sourceFile.fileName) >= 0) {
            traverse(sourceFile, (node: ts.Node) => {
                const nodeConstraints = constraintsCache.getNodeConstraints(node);
                const ctxType = checker.getContextualType(<ts.Expression>node);
                if (nodeConstraints) {
                    // Don't propagate contextual type up of `test ? x : null`, as x will be inferred to be nullable.
                    if (node.parent && node.parent.kind !== ts.SyntaxKind.ConditionalExpression) {
                        // console.log(`CTX(${nodeConstraints.description} = ${node.getFullText().trim()}) = ${ctxType && checker.typeToString(ctxType)}`);
                        nodeConstraints.isType(ctxType);

                        if (node.parent.kind != ts.SyntaxKind.ExpressionStatement) {
                            nodeConstraints.cannotBeVoid();
                        }
                    }
                }

                if (node.kind === ts.SyntaxKind.CallExpression) {
                    const call = <ts.CallExpression>node;
                    const calleeConstraints = constraintsCache.getNodeConstraints(call.expression);

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
                        callConstraints.hasArity(argTypes.length);
                        argTypes.forEach((t, i) => {
                            const argConstraints = callConstraints.getArgType(i);
                            const arg = call.arguments[i];
                            if (arg) {
                                argConstraints.addNameHint(guessName(arg));
                            }
                            // console.log(`  ARG(${i}): ${checker.typeToString(t)}`);
                            argConstraints.isType(t);
                        });
                    }
                } else if (node.kind === ts.SyntaxKind.ReturnStatement) {
                    const ret = <ts.ReturnStatement>node;
                    if (ret.expression) {
                        const exe = <ts.FunctionLikeDeclaration>nodes.findParent(ret, nodes.isFunctionLikeDeclaration);
                        const constraints = constraintsCache.getNodeConstraints(exe);
                        if (constraints) {
                            constraints.getCallConstraints().returnType.cannotBeVoid();
                        }
                    }
                } else if (node.kind === ts.SyntaxKind.BinaryExpression) {
                    const binExpr = <ts.BinaryExpression>node;
                    const [leftType, rightType] = [binExpr.left, binExpr.right].map(e => checker.getTypeAtLocation(e));
                    
                    const leftConstraints = constraintsCache.getNodeConstraints(binExpr.left);
                    const rightConstraints = constraintsCache.getNodeConstraints(binExpr.right);

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
                        constraintsCache.nodeIsBooleanLike(binExpr.left);
                        // In `a && b`, we know that `a` is bool-like but know absolutely nothing about `b`.
                        // But if that is embedded in `(a && b) && c`, then it's another game.
                        // TODO: propagate contextual type upwards.
                        constraintsCache.nodeIsBooleanLike(binExpr.right);
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
                    const constraints = constraintsCache.getNodeConstraints(expr.operand);
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
                constraintsCache.nodeIsBooleanLike((<ts.IfStatement>node).expression);
                } else if (node.kind === ts.SyntaxKind.ConditionalExpression) {
                constraintsCache.nodeIsBooleanLike((<ts.ConditionalExpression>node).condition);
                }
            });
        }
    }
  }

  // TODO: check if a constraint has seen any new info, then as long as some do, do our own loop to avoid writing files.
//   for (let i = 0; i < options.maxSubInferenceCount; i++) {
    inferOnce();
//     if (!constraintsCache.hasChanges) {
//         break;
//     }
//   }
  
  applyConstraints(constraintsCache.allConstraints, checker, addChange);
}
