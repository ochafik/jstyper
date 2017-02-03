import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from '../utils/language_service_reactor';
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import {isCallTarget, traverse} from '../utils/nodes';
import {isAny, isBoolean, isBooleanLike, isNumber, isNumberOrString, isString, isStructuredType} from '../utils/flags';

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
                    argTypes.forEach((t, i) => callConstraints!.getArgType(i).isType(t));
                }
            }
            if (node.kind === ts.SyntaxKind.BinaryExpression) {
                const binExpr = <ts.BinaryExpression>node;
                const [[leftType, leftSym], [rightType, rightSym]] = [binExpr.left, binExpr.right].map(typeAndSymbol);
                
                const leftConstraints = getNodeConstraints(binExpr.left);
                const rightConstraints = getNodeConstraints(binExpr.right);

                switch (binExpr.operatorToken.kind) {
                    case ts.SyntaxKind.PlusToken:
                    case ts.SyntaxKind.PlusEqualsToken:
                        if (leftConstraints && isNumberOrString(rightType)) {
                            leftConstraints.isNumberOrString();
                        }
                        if (rightConstraints && isNumberOrString(leftType)) {
                            rightConstraints.isNumberOrString();
                        }
                        break;
                    case ts.SyntaxKind.MinusToken:
                    case ts.SyntaxKind.MinusEqualsToken:
                    case ts.SyntaxKind.AsteriskToken:
                    case ts.SyntaxKind.AsteriskEqualsToken:
                    case ts.SyntaxKind.AsteriskAsteriskToken:
                    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                    case ts.SyntaxKind.SlashToken:
                    case ts.SyntaxKind.SlashEqualsToken:
                    case ts.SyntaxKind.PercentToken:
                    case ts.SyntaxKind.PercentEqualsToken:
                    case ts.SyntaxKind.LessThanToken:
                    case ts.SyntaxKind.LessThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanToken:
                    case ts.SyntaxKind.GreaterThanEqualsToken:
                    case ts.SyntaxKind.LessThanLessThanToken:
                    case ts.SyntaxKind.LessThanLessThanEqualsToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanToken:
                    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                    case ts.SyntaxKind.AmpersandToken:
                    case ts.SyntaxKind.AmpersandEqualsToken:
                    case ts.SyntaxKind.BarToken:
                    case ts.SyntaxKind.BarEqualsToken:
                    case ts.SyntaxKind.CaretToken:
                    case ts.SyntaxKind.CaretEqualsToken:
                        if (leftConstraints) {
                            leftConstraints.isNumber();
                        }
                        if (rightConstraints) {
                            rightConstraints.isNumber();
                        }
                        break;
                    case ts.SyntaxKind.EqualsEqualsToken:
                    case ts.SyntaxKind.EqualsEqualsEqualsToken:
                    case ts.SyntaxKind.ExclamationEqualsToken:
                    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                        if (leftConstraints && rightType && !isAny(rightType)) {
                            leftConstraints.isType(rightType);
                        }
                        if (rightConstraints && leftType && !isAny(leftType)) {
                            rightConstraints.isType(leftType);
                        }
                        // if (leftConstraints) {
                        //     // if (isNumber(rightType) || isString(rightType)) {
                        //     leftConstraints.isType(rightType);
                        //     // }
                        // }
                        break;
                    default:
                        // console.log(`OP: ${binExpr.operatorToken.kind}`);
                }
            }

        });
    }
  }

  for (const [sym, constraints] of allConstraints) {
      const resolved = constraints.resolve();
      const initial = constraints.initialType && checker.typeToString(constraints.initialType);
      if (resolved == null || resolved == initial) {
        continue;
      }
      
      let [decl] = sym.getDeclarations();

      let insertionPoint = decl.getEnd();
      let length = 0;
      if (decl.kind == ts.SyntaxKind.Parameter || decl.kind == ts.SyntaxKind.VariableDeclaration) {
        const varDecl = <ts.ParameterDeclaration | ts.VariableDeclaration>decl;
        if (varDecl.type) {
            const start = varDecl.type.getStart();
            // const start = varDecl.type.getFirstToken().getStart();
            // const end = varDecl.type.getLastToken().getStart();
            // console.log(`REPLACING "${varDecl.type.getFullText()}"
            //     resolved: "${resolved}"
            //      initial: "${initial}"
            //    replacing: "${decl.getSourceFile().getFullText().slice(start, end)}"`);

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
        constraints = new TypeConstraints(services, checker, type && isAny(type) ? undefined : type);
        allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  function getNodeConstraints(node: ts.Node): TypeConstraints | undefined {
    if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
        const access = <ts.PropertyAccessExpression>node;
        const sym = checker.getSymbolAtLocation(access.expression);
        if (sym) {
            return getSymbolConstraints(sym).getFieldConstraints(access.name.text);
        }
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
        let calleeConstraints = getNodeConstraints((<ts.CallExpression>node).expression);
        if (calleeConstraints) {
            return calleeConstraints.getCallConstraints().returnType;
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
