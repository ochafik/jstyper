import * as ts from "typescript";
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import * as fl from "../utils/flags";
import {Options} from '../options';
import {applyConstraints} from './apply_constraints';

export class ConstraintsCache {
  
  allConstraints = new Map<ts.Symbol, TypeConstraints>();

  constructor(
    private services: ts.LanguageService,
    private options: Options,
    private program: ts.Program,
    private checker: ts.TypeChecker) {}

  nodeIsBooleanLike(node: ts.Node) {
      const constraints = this.getNodeConstraints(node);
      if (constraints) {
          constraints.isBooleanLike();
      }
  }

  private getSymbolConstraints(sym: ts.Symbol): TypeConstraints {
    let constraints = this.allConstraints.get(sym);
    if (!constraints) {
        const decls = sym.getDeclarations();
        let type: ts.Type | undefined;
        if (decls && decls.length > 0) {
          type = this.checker.getTypeOfSymbolAtLocation(sym, decls[0]);
        }
        constraints = new TypeConstraints(this.services, this.checker, this.options, type && !fl.isAny(type) ? type : undefined);
        this.allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  getNodeConstraints(node: ts.Node): TypeConstraints | undefined {

    while (node.kind === ts.SyntaxKind.ParenthesizedExpression) {
        node = (<ts.ParenthesizedExpression>node).expression;
    }

    if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
        const access = <ts.PropertyAccessExpression>node;
        const constraints = this.getNodeConstraints(access.expression);
        if (constraints) {
            return constraints.getFieldConstraints(access.name.text);
        }
    } else if (node.kind === ts.SyntaxKind.CallExpression) {
        let constraints = this.getNodeConstraints((<ts.CallExpression>node).expression);
        if (constraints) {
            return constraints.getCallConstraints().returnType;
        }
    } else if (node.kind === ts.SyntaxKind.Identifier) {
        const sym = this.checker.getSymbolAtLocation(node);
        if (sym) {
            const decls = sym.getDeclarations();
            if (decls && decls.length > 0) {
                for (const decl of decls) {
                // const decl = decls[0];
                    if (decl.parent && decl.parent.kind === ts.SyntaxKind.FunctionDeclaration) {
                        const param = <ts.ParameterDeclaration>decl;
                        const fun = <ts.FunctionDeclaration>decl.parent;
                        const paramIndex = fun.parameters.indexOf(param);
                        const funConstraints = this.getNodeConstraints(fun);
                        if (funConstraints) {
                            return funConstraints.getCallConstraints().getArgType(paramIndex);
                        }
                        // return;
                    }
                }
            }
            return this.getSymbolConstraints(sym);
        }
    }
    return undefined;
  }
}
