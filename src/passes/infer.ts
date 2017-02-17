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
import * as objects from '../matchers/objects';
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
              nodeConstraints.isType(ctxType, true, ts.TypeFlags.Undefined | ts.TypeFlags.Null);

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
            const props = objects.matchProperties(node, checker);
            if (props) {
              const objectConstraints = constraintsCache.getNodeConstraints(props.target);
              if (objectConstraints) {
                for (const prop of props.properties) {
                  const fieldConstraints = prop.isComputedName
                      ? objectConstraints.getComputedFieldConstraints(prop.name)
                      : objectConstraints.getFieldConstraints(prop.name);

                  for (const propType of prop.valueTypes) {
                    fieldConstraints.isType(propType);
                    fieldConstraints.isUndefined();
                  }
                  if (prop.writable) {
                    fieldConstraints.isWritable();
                  }
                }
              }
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
            ops.inferBinaryOpConstraints(node, ctxType, checker, constraintsCache);
          } else if (nodes.isUnaryExpression(node)) {
            ops.inferUnaryOpConstraints(node.operator, constraintsCache.getNodeConstraints(node.operand));
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
