import * as ts from "typescript";
import {AddChangeCallback, ReactorCallback} from './language_service_reactor';
import {TypeConstraints, CallConstraints} from './constraints';

export const infer: ReactorCallback = (fileNames, services, addChange) => {
  
  const allConstraints = new Map<ts.Symbol, TypeConstraints>();
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
      if (fileNames.indexOf(sourceFile.fileName) >= 0) {
          ts.forEachChild(sourceFile, n => visit(sourceFile.fileName, n));
      }
  }

  for (const [sym, constraints] of allConstraints) {
      const resolved = constraints.resolve();
      const initial = constraints.initialType && typeToString(constraints.initialType);
      if (resolved == null || resolved == initial) {
        continue;
      }
    //   console.log(`CONSTRAINTS for ${checker.symbolToString(sym)}: ${resolved}`);
      
      let [decl] = sym.getDeclarations();
      // console.log(`${decl.getFullText()}: ${newText}`)

      let insertionPoint = decl.getEnd();
      let length = 0;
      if (decl.kind == ts.SyntaxKind.Parameter || decl.kind == ts.SyntaxKind.VariableDeclaration) {
        const varDecl = <ts.ParameterDeclaration | ts.VariableDeclaration>decl;
        if (varDecl.type) {
            const start = varDecl.type.getStart();
            // console.log(`REPLACING "${varDecl.type.getFullText()}" with "${resolved}"`);
            addChange(decl.getSourceFile().fileName, {
                span: {
                    start: start,
                    length: varDecl.type.getEnd() - start
                },
                newText: ' ' + resolved
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

  function typeToString(t: ts.Type | string | null) {
    if (t == null) return null;
    if (typeof t === 'string') return t;
    if (t.flags & ts.TypeFlags.NumberLiteral) {
      return 'number';
    }
    return checker.typeToString(t);
  }

  function argsListToString(types: ts.Type[]): string {
    return types.map((t, i) => `arg${i + 1}: ${typeToString(t) || 'any'}`).join(', ');
  }

  function symbolToString(t: ts.Symbol | null) {
      return t == null ? null : checker.symbolToString(t);
  }

  function getConstraints(sym: ts.Symbol): TypeConstraints {
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
        const [type, sym] = typeAndSymbol(access.expression);
        if (sym) {
            return getConstraints(sym).getFieldConstraints(access.name.text);
        }
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
        let calleeConstraints = getNodeConstraints((<ts.CallExpression>node).expression);
        if (calleeConstraints) {
            return calleeConstraints.getCallConstraints().returnType;
        }
    } else if (node.kind === ts.SyntaxKind.Identifier) {
        const [type, sym] = typeAndSymbol(node);
        if (sym) {
            return getConstraints(sym);
        }
    }
    return undefined;
  }
  /** visit nodes finding exported classes */    
  function visit(fileName: string, node: ts.Node) {
        // console.log(`[${fileName}] Node: ${node.kind}`);

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
                    if (leftConstraints && rightType) {
                        if (isNumber(rightType)) {
                            leftConstraints.isNumber();
                        }
                    }
                    break;
                case ts.SyntaxKind.EqualsEqualsToken:
                case ts.SyntaxKind.EqualsEqualsEqualsToken:
                    if (leftConstraints && rightType && !isAny(rightType)) {
                        if (isNumber(rightType) || isString(rightType)) {
                            // console.log(`GOT RIGHT[${binExpr.right.getFullText()}] == type ${typeToString(rightType)}`);
                            leftConstraints.isType(rightType);
                        }
                    }
                    break;
                default:
                    // console.log(`OP: ${binExpr.operatorToken.kind}`);
            }
        }
        
        ts.forEachChild(node, n => visit(fileName, n));
    }
}

function isNumber(t: ts.Type): boolean {
    return (t.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) !== 0;
}
function isString(t: ts.Type): boolean {
    return (t.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.StringOrNumberLiteral)) !== 0;
}
function isAny(t: ts.Type): boolean {
    return (t.flags & ts.TypeFlags.Any) === ts.TypeFlags.Any;
}
function isStructuredType(t: ts.Type): boolean {
    return (t.flags & ts.TypeFlags.StructuredType) !== 0;
}
function isCallTarget(n: ts.Node): boolean {
    if (n.parent && n.parent.kind == ts.SyntaxKind.CallExpression) {
      const call = <ts.CallExpression>n.parent;
      return call.expression === n;
    }
    return false;
}