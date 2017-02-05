import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import * as fl from "../utils/flags";
import * as ops from '../utils/operators';
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
                if (ctxType) {//} && !isAny(ctxType)) {
                    if (nodeConstraints) {
                        nodeConstraints.isType(ctxType);
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
                        argTypes.forEach((t, i) => {
                            // console.log(`  ARG(${i}): ${checker.typeToString(t)}`);
                            callConstraints!.getArgType(i).isType(t);
                        });
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
                        constraintsCache.nodeIsBooleanLike(binExpr.left);
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
//   }
  
  applyConstraints(constraintsCache.allConstraints, checker, addChange);
}
