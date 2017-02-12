import * as ts from "typescript";
import {TypeConstraints, CallConstraints} from '../utils/type_constraints';
import * as fl from "../utils/flags";
import * as nodes from "../utils/nodes";
import {Options} from '../options';
import {applyConstraints} from '../utils/apply_constraints';

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

    while (nodes.isParenthesizedExpression(node)) {
      node = node.expression;
    }

        // || nodes.isElementAccessExpression(node)
    if (nodes.isPropertyAccessExpression(node)) {
        const constraints = this.getNodeConstraints(node.expression);
        if (constraints) {
            return constraints.getFieldConstraints(node.name.text);
        }
    } else if (nodes.isCallExpression(node)) {
        let constraints = this.getNodeConstraints(node.expression);
        if (constraints) {
            return constraints.getCallConstraints().returnType;
        }
    } else if (nodes.isConstructor(node) ||
            nodes.isArrowFunction(node) ||
            nodes.isFunctionExpression(node)) {
        const sym = node['symbol'];//this.checker.getSymbolAtLocation(node);
        if (sym) {
            return this.getSymbolConstraints(sym);
        }
    } else if (nodes.isFunctionLikeDeclaration(node) ||
            nodes.isInterfaceDeclaration(node) ||
            nodes.isVariableDeclaration(node)) {
        const sym = node.name && this.checker.getSymbolAtLocation(node.name);
        if (sym) {
            return this.getSymbolConstraints(sym);
        }
    } else if (nodes.isParameter(node)) {
        if (node.parent && nodes.isFunctionLikeDeclaration(node.parent)) {
            const paramIndex = node.parent.parameters.indexOf(node);
            const funConstraints = this.getNodeConstraints(node.parent);
            // console.log(`FUN constraints: ${funConstraints}`);
            if (funConstraints) {
                return funConstraints.getCallConstraints().getArgType(paramIndex);
            }
        }
    } else if (nodes.isIdentifier(node)) {
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
                }
            }
        }
    }
    return undefined;
  }
}
