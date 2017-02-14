import * as ts from 'typescript';

import {Options} from '../options';
import {applyConstraints} from '../utils/apply_constraints';
import {ConstraintsCache} from '../utils/constraints_cache';
import * as fl from '../utils/flags';
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {guessName} from '../utils/name_guesser';
import * as nodes from '../utils/nodes';
import {isCallTarget, traverse} from '../utils/nodes';
import * as ops from '../utils/operators';
import {CallConstraints, TypeConstraints} from '../utils/type_constraints';

export const infer: (options: Options) => ReactorCallback = (options) => (
    fileNames, services, addChange, addRequirement) => {

  const program = services.getProgram();
  const checker = program.getTypeChecker();
  const constraintsCache =
      new ConstraintsCache(services, options, program, checker);

  function inferOnce() {
    for (const sourceFile of program.getSourceFiles()) {
      if (fileNames.indexOf(sourceFile.fileName) < 0) {
        console.warn(`SKIPPING ${sourceFile.fileName}`);
      }
      if (fileNames.indexOf(sourceFile.fileName) >= 0) {
        traverse(sourceFile, (node: ts.Node) => {
          const nodeConstraints = constraintsCache.getNodeConstraints(node);
          const ctxType = checker.getContextualType(
              <ts.Expression>node);  // TODO: isExpression
          if (nodeConstraints) {
            // Don't propagate contextual type up of `test ? x : null`, as x
            // will be inferred to be nullable.
            if (node.parent && !nodes.isConditionalExpression(node.parent)) {
              // console.log(`CTX(${nodeConstraints.description} =
              // ${node.getFullText().trim()}) = ${ctxType &&
              // checker.typeToString(ctxType)}`);
              nodeConstraints.isType(ctxType);

              if (!nodes.isExpressionStatement(node.parent)) {
                nodeConstraints.cannotBeVoid();
              }
            }
          }

          if (nodes.isCallExpression(node)) {
            const constraints = constraintsCache.getNodeConstraints(node.expression);
            if (constraints) {
              fillCallConstraints(
                  constraints.getCallConstraints(),
                  ctxType,
                  node.parent != null && nodes.isExpressionStatement(node.parent),
                  node.arguments);
            }
          } else if (nodes.isNewExpression(node)) {
            const constraints = constraintsCache.getNodeConstraints(node.expression);
            if (constraints) {
              fillCallConstraints(
                  constraints.getCallConstraints(),
                  ctxType,
                  node.parent != null && nodes.isExpressionStatement(node.parent),
                  node.arguments).isConstructible();
            }
          } else if (nodes.isReturnStatement(node)) {
            if (node.expression) {
              const exe = <ts.FunctionLikeDeclaration>nodes.findParent(
                  node, nodes.isFunctionLikeDeclaration);
              const constraints = constraintsCache.getNodeConstraints(exe);
              if (constraints) {
                constraints.getCallConstraints().returnType.cannotBeVoid();
              }
            }
          } else if (nodes.isBinaryExpression(node)) {
            const [leftType, rightType] =
                [node.left, node.right].map(e => checker.getTypeAtLocation(e));

            const leftConstraints =
                constraintsCache.getNodeConstraints(node.left);
            const rightConstraints =
                constraintsCache.getNodeConstraints(node.right);

            const op = node.operatorToken.kind;

            if (nodes.isInKeyword(node.operatorToken)) {
              if (rightConstraints && nodes.isStringLiteral(node.left)) {
                rightConstraints.getComputedFieldConstraints(node.left.text).isUndefined();
              }
            }
            if (ops.binaryNumberOperators.has(op)) {
              if (leftConstraints) {
                leftConstraints.isNumber();
              }
              if (rightConstraints) {
                rightConstraints.isNumber();
              }
            }
            if (ops.binaryNumberOrStringOperators.has(op)) {
              if (fl.isNumber(ctxType)) {
                leftConstraints && leftConstraints.isNumber();
                rightConstraints && rightConstraints.isNumber();
              }
            }
            if (ops.equalityLikeOperators.has(op)) {
              // This is a bit bold: we assume if things can be equatable, then
              // they have the same type.
              function handle(
                  constraints: TypeConstraints|undefined, otherType: ts.Type) {
                if (leftConstraints && otherType) {
                  if (fl.isPrimitive(otherType)) {  //! isAny(otherType)) {
                    leftConstraints.isType(otherType);
                  } else if (fl.isNull(otherType)) {
                    leftConstraints.isNullable();
                  }
                }
              }
              handle(leftConstraints, rightType);
              handle(rightConstraints, leftType);
            } 
            if (ops.binaryBooleanOperators.has(op)) {
              constraintsCache.nodeIsBooleanLike(node.left);
              // In `a && b`, we know that `a` is bool-like but know absolutely
              // nothing about `b`.
              // But if that is embedded in `(a && b) && c`, then it's another
              // game.
              // TODO: propagate contextual type upwards.
              constraintsCache.nodeIsBooleanLike(node.right);
            }
            if (ops.assignmentOperators.has(op)) {
              if (leftConstraints) {
                leftConstraints.isWritable();
              }
              if (op == ts.SyntaxKind.PlusEqualsToken) {
                if (leftConstraints && fl.isNumber(leftConstraints.flags) &&
                    rightConstraints) {
                  rightConstraints.isNumber();
                }
                // handlePlusOp(leftConstraints, rightType);
              } else if (leftConstraints && rightType && !fl.isAny(rightType)) {
                leftConstraints.isType(rightType);
              }
            }
          // } else if (nodes.isAssignment)
          } else if (
              nodes.isPostfixUnaryExpression(node) ||
              nodes.isPrefixUnaryExpression(node)) {
            const constraints =
                constraintsCache.getNodeConstraints(node.operand);
            //   console.log(`leftConstraints for ${node.getFullText()}:
            //   ${leftConstraints} (op = ${node.operator},
            //   ops.unaryNumberOperators =
            //   ${[...ops.unaryNumberOperators.values()]})`);
            if (constraints) {
              const op = node.operator;
              if (ops.unaryNumberOperators.has(op)) {
                constraints.isNumber();
              } else if (ops.unaryBooleanOperators.has(op)) {
                constraints.isBooleanLike();
              }
            }
          } else if (nodes.isDeleteExpression(node)) {
            const constraints = constraintsCache.getNodeConstraints(node.expression);
            if (constraints) {
              constraints.isWritable();
              constraints.isUndefined();
            }
          } else if (nodes.isIfStatement(node)) {
            constraintsCache.nodeIsBooleanLike(node.expression);
          } else if (nodes.isConditionalExpression(node)) {
            constraintsCache.nodeIsBooleanLike(node.condition);
          }
        });
      }
    }
  }

  function fillCallConstraints(callConstraints: CallConstraints, returnType: ts.Type | undefined, isVoid: boolean, args?: ts.Node[]) {
      if (!args) {
        args = [];
      }
      const argTypes = args.map(a => checker.getTypeAtLocation(a)) || [];

      if (returnType) {
        callConstraints.returnType.isType(returnType);
      } else if (isVoid) {
        callConstraints.returnType.isVoid();
      }
      
      // console.log(`CALL(${call.getFullText()}):`);
      callConstraints.hasArity(argTypes.length);
      argTypes.forEach((t, i) => {
        const argConstraints = callConstraints.getArgType(i);
        const arg = args![i];
        if (arg) {
          argConstraints.addNameHint(guessName(arg));
        }
        // console.log(`  ARG(${i}): ${checker.typeToString(t)}`);
        argConstraints.isType(t);
      });

      return callConstraints;
  }


  // TODO: check if a constraint has seen any new info, then as long as some do,
  // do our own loop to avoid writing files.
  //   for (let i = 0; i < options.maxSubInferenceCount; i++) {
  inferOnce();
  //     if (!constraintsCache.hasChanges) {
  //         break;
  //     }
  //   }

  applyConstraints(constraintsCache.allConstraints, constraintsCache.requireConstraints, checker, addChange, addRequirement);
}
