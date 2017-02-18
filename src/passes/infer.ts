import * as ts from 'typescript';

import {Options} from '../options';
import {applyConstraints} from '../utils/apply_constraints';
import {ConstraintsCache} from '../utils/constraints_cache';
import {TypeConstraints} from '../utils/type_constraints';
import {ReactorCallback} from '../utils/language_service_reactor';
import {guessName} from '../utils/name_guesser';
import * as flags from '../utils/flags';
import * as nodes from '../utils/nodes';
import * as ops from '../utils/operators';
import * as objects from '../matchers/objects';
import {CallConstraints} from '../utils/type_constraints';

export const infer: (options: Options) => ReactorCallback = (options) => (
    fileNames, services, addChange, addRequirement) => {

  const program = services.getProgram();
  const checker = program.getTypeChecker();
  const constraintsCache = new ConstraintsCache(services, options, checker);

  function inferOnce() {
    for (const sourceFile of program.getSourceFiles()) {
      if (fileNames.indexOf(sourceFile.fileName) < 0) {
        console.warn(`SKIPPING ${sourceFile.fileName}`);
      }
      if (fileNames.indexOf(sourceFile.fileName) >= 0) {
        nodes.traverse(sourceFile, (node: ts.Node) => {
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
              nodeConstraints.isType(ctxType, true, false, ts.TypeFlags.Undefined | ts.TypeFlags.Null);

              if (!nodes.isExpressionStatement(node.parent)) {
                nodeConstraints.cannotBeVoid();
              }
            }
          }

          function defineProperty(objectConstraints: TypeConstraints, name: string, isComputedName: boolean, desc?: objects.MatchedPropertyDescriptor) {
            if (!desc) return;

            const fieldConstraints = isComputedName
                ? objectConstraints.getComputedFieldConstraints(name)
                : objectConstraints.getFieldConstraints(name);

            for (const propType of desc.valueTypes) {
              fieldConstraints.isType(propType);
              fieldConstraints.isUndefined();
            }
            if (desc.writable) {
              fieldConstraints.isWritable();
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
            const simpleSelect = objects.matchSimpleSelect(node.expression);
            if (simpleSelect && simpleSelect.targetName == 'Object') {
              switch (simpleSelect.selectedName) {
                case 'defineProperty':
                  if (node.arguments.length == 3) {
                    const [target, name, desc] = node.arguments;
                    const objectConstraints = constraintsCache.getNodeConstraints(target);
                    if (!objectConstraints) break;

                    if (nodes.isStringLiteral(name) && nodes.isObjectLiteralExpression(desc)) {
                      defineProperty(objectConstraints, name.text, true, objects.matchPropertyDescriptor(desc, checker));
                    }
                  }
                  break;
                case 'defineProperties':
                  if (node.arguments.length == 2) {
                    const [target, descs] = node.arguments;
                    const objectConstraints = constraintsCache.getNodeConstraints(target);
                    if (!objectConstraints) break;

                    if (nodes.isObjectLiteralExpression(descs)) {
                      const props = objects.matchPropertyDescriptors(descs, checker);
                      if (props) {
                        for (const prop of props.properties) {
                          defineProperty(objectConstraints, prop.name, prop.isComputedName, prop);
                        }
                      }
                    }
                  }
                  break;
                case 'assign':
                  if (node.arguments.length >= 2) {
                    const [destination, ...sources]  = node.arguments;
                    const destinationType = checker.getTypeAtLocation(destination);
                    const destinationTypeProps = destinationType.getProperties();

                    function hasExistingProp(matchedName: objects.MatchedDeclarationName) {
                      if (!destinationTypeProps) return false;
                      for (const prop of destinationTypeProps) {
                        const decls = prop.declarations;
                        if (decls) {
                          for (const decl of decls) {
                            if (decl.name) {
                              const name = objects.matchDeclarationName(decl.name);
                              if (name && name.name == matchedName.name &&
                                  (!options.differentiateComputedProperties || name.isComputedName == matchedName.isComputedName)) {
                                return true;
                              }
                            }
                          }
                        }
                      }
                      return false;
                    }
                      
                    const destinationConstraints = constraintsCache.getNodeConstraints(destination);
                    if (destinationConstraints) {
                      for (const source of sources) {
                        const sourceType = checker.getTypeAtLocation(source);
                        destinationConstraints.isType(sourceType);
                        for (const prop of sourceType.getProperties()) {
                          if (prop.declarations) {
                            for (const decl of prop.declarations) {
                              if (decl.name) {
                                const matchedName = objects.matchDeclarationName(decl.name);
                                if (matchedName) {
                                  const {name, isComputedName} = matchedName;
                                  const fieldConstraints = isComputedName
                                      ? destinationConstraints.getComputedFieldConstraints(name)
                                      : destinationConstraints.getFieldConstraints(name);
                                  if (//!flags.isAny(destinationType) &&
                                      //!flags.isAny(destinationConstraints.flags) &&
                                      !hasExistingProp(matchedName)) {
                                    fieldConstraints.isUndefined();
                                  }
                                  fieldConstraints.isWritable();
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  break;
                // case 'create':
                //   break;
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
        argConstraints.isType(t, true, true);
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

  applyConstraints(constraintsCache.allConstraints, constraintsCache.requireConstraints, addChange, addRequirement);
}
