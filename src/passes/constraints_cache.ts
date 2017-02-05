import * as ts from "typescript";
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import * as fl from "../utils/flags";
import * as nodes from "../utils/nodes";
import {Options} from '../options';
import {applyConstraints} from './apply_constraints';

export class ConstraintsCache {
  
  allConstraints = new Map<ts.Symbol, TypeConstraints>();

  constructor(
    private services: ts.LanguageService,
    private options: Options,
    private program: ts.Program,
    private checker: ts.TypeChecker) {}

  get hasChanges() {
    for (const c of this.allConstraints.values()) {
        if (c.hasChanges) return true;
    }
    return false;
  }
  nodeIsBooleanLike(node: ts.Node) {
      const constraints = this.getNodeConstraints(node);
      if (constraints) {
          constraints.isBooleanLike();
      }
  }

  private getSymbolConstraints(sym: ts.Symbol): TypeConstraints {
    let constraints = this.allConstraints.get(sym);
    if (!constraints) {
        // console.log(`Building constraints for ${this.checker.symbolToString(sym)}`);
        const decls = sym.getDeclarations();
        let type: ts.Type | undefined;
        if (decls && decls.length > 0) {
          type = this.checker.getTypeOfSymbolAtLocation(sym, decls[0]);
        }
        constraints = new TypeConstraints(this.checker.symbolToString(sym), this.services, this.checker, this.options, type && !fl.isAny(type) ? type : undefined);
        this.allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  getNodeConstraints(node: ts.Node): TypeConstraints | undefined {
    // console.log(`getNodeConstraints(${nodes.getNodeKindDebugDescription(node)})`);

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
    } else if (node.kind === ts.SyntaxKind.FunctionDeclaration ||
            node.kind === ts.SyntaxKind.ArrowFunction ||
            node.kind === ts.SyntaxKind.FunctionExpression ||
            node.kind == ts.SyntaxKind.InterfaceDeclaration ||
            node.kind == ts.SyntaxKind.VariableDeclaration) {
        const decl = <ts.FunctionLikeDeclaration | ts.InterfaceDeclaration | ts.VariableDeclaration>node;
        const sym = decl.name && this.checker.getSymbolAtLocation(decl.name);
        if (sym) {
            return this.getSymbolConstraints(sym);
        }
    } else if (node.kind === ts.SyntaxKind.Parameter) {
        const parentFun = <ts.FunctionDeclaration>nodes.findParentOfKind(node, ts.SyntaxKind.FunctionDeclaration);
        if (parentFun) {
            const param = <ts.ParameterDeclaration>node;
            const paramIndex = parentFun.parameters.indexOf(param);
            const funConstraints = this.getNodeConstraints(parentFun);
            // console.log(`FUN constraints: ${funConstraints}`);
            if (funConstraints) {
                return funConstraints.getCallConstraints().getArgType(paramIndex);
            }
        }
    } else if (node.kind === ts.SyntaxKind.Identifier) {
        const sym = this.checker.getSymbolAtLocation(node);
        if (sym) {
            const decls = sym.getDeclarations();
            // console.log(`DECLS for idend ${node.getFullText()}: ${decls && decls.length}`);
            if (decls && decls.length > 0) {
                for (const decl of decls) {
                    const constraints = this.getNodeConstraints(decl);
                    if (constraints) {
                        return constraints;
                    }
                    // // console.log(`DECL.parent.kind: ${decl.parent && decl.parent.kind}`);
                    // if (decl.kind == ts.SyntaxKind.Parameter || decl.kind === ts.SyntaxKind.Decorator) {
                    //     const parentFun = <ts.FunctionDeclaration>findParentOfKind(decl, ts.SyntaxKind.FunctionDeclaration);
                    //     if (parentFun) {
                    //         const param = <ts.ParameterDeclaration>decl;
                    //         const paramIndex = parentFun.parameters.indexOf(param);
                    //         const funConstraints = this.getNodeConstraints(parentFun);
                    //         // console.log(`FUN constraints: ${funConstraints}`);
                    //         if (funConstraints) {
                    //             return funConstraints.getCallConstraints().getArgType(paramIndex);
                    //         }
                    //     } else {
                    //         console.warn(`Found no parent function decl for ${node.getFullText()}`);
                    //         return undefined;
                    //     }
                    // } else if (decl.kind == ts.SyntaxKind.FunctionDeclaration ||
                    //     decl.kind == ts.SyntaxKind.InterfaceDeclaration ||
                    //     decl.kind == ts.SyntaxKind.VariableDeclaration) {
                    //   return this.getSymbolConstraints(sym);
                    // }
                }
            }
        }
    }
    return undefined;
  }
}
