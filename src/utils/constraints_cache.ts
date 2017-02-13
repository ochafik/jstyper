import * as ts from 'typescript';

import {Options} from '../options';
import * as fl from '../utils/flags';
import * as nodes from '../utils/nodes';
import {CallConstraints, TypeConstraints} from '../utils/type_constraints';

import {applyConstraints} from './apply_constraints';

export class ConstraintsCache {
  allConstraints = new Map<ts.Symbol, TypeConstraints>();
  requireConstraints = new Map<string, TypeConstraints>();

  constructor(
      private services: ts.LanguageService, private options: Options,
      private program: ts.Program, private checker: ts.TypeChecker) {}

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

  private getRequireConstraints(requirePath: string): TypeConstraints {
    let constraints = this.requireConstraints.get(requirePath);
    if (!constraints) {
      // console.log(`Building constraints for
      // ${this.checker.symbolToString(sym)}`);
      constraints = new TypeConstraints(
          `require(${requirePath})`, this.services, this.checker,
          this.options, undefined);
      this.requireConstraints.set(requirePath, constraints);
    }
    return constraints;
  }

  private getSymbolConstraintsAtLocation(node?: ts.Node): TypeConstraints | undefined {
    const sym = node && this.checker.getSymbolAtLocation(node);
    return sym && this.getSymbolConstraints(sym);
  }

  private getSymbolConstraints(sym: ts.Symbol): TypeConstraints {
    let constraints = this.allConstraints.get(sym);
    if (!constraints) {
      // console.log(`Building constraints for
      // ${this.checker.symbolToString(sym)}`);
      const decls = sym.getDeclarations();
      let type: ts.Type|undefined;
      if (decls && decls.length > 0) {
        type = this.checker.getTypeOfSymbolAtLocation(sym, decls[0]);
      }
      constraints = new TypeConstraints(
          this.checker.symbolToString(sym), this.services, this.checker,
          this.options, type && !fl.isAny(type) ? type : undefined);
      this.allConstraints.set(sym, constraints);
    }
    return constraints;
  }

  getNodeConstraints(node: ts.Node): TypeConstraints|undefined {
    // console.log(`getNodeConstraints(${nodes.getNodeKindDebugDescription(node)})`);

    while (nodes.isParenthesizedExpression(node)) {
      node = node.expression;
    }

    if (nodes.isPropertyAccessExpression(node)) {
      const constraints = this.getNodeConstraints(node.expression);
      if (constraints) {
        return constraints.getFieldConstraints(node.name.text);
      }
    } else if (nodes.isElementAccessExpression(node) && nodes.isStringLiteral(node.argumentExpression)) {
      const constraints = this.getNodeConstraints(node.expression);
      if (constraints) {
        return constraints.getComputedFieldConstraints(node.argumentExpression.text);
      }
    } else if (nodes.isCallExpression(node)) {
      let constraints = this.getNodeConstraints(node.expression);
      if (constraints) {
        return constraints.getCallConstraints().returnType;
      }
    } else if (
        nodes.isConstructor(node) || nodes.isArrowFunction(node) ||
        nodes.isFunctionExpression(node)) {
      const sym = node['symbol'];  // this.checker.getSymbolAtLocation(node);
      if (sym) {
        return this.getSymbolConstraints(sym);
      }
    } else if (nodes.isVariableDeclaration(node)) {
      let requiredPath = nodes.getRequiredPath(node.initializer);
      if (requiredPath && !requiredPath.startsWith('.')) {
        return this.getRequireConstraints(requiredPath);
      }
      return this.getSymbolConstraintsAtLocation(node.name);
    } else if (nodes.isFunctionLikeDeclaration(node) || nodes.isInterfaceDeclaration(node)) {
      return this.getSymbolConstraintsAtLocation(node.name);
    } else if (nodes.isParameter(node)) {
      if (node.parent && nodes.isFunctionLikeDeclaration(node.parent)) {
        const paramIndex = node.parent.parameters.indexOf(node);
        const funConstraints = this.getNodeConstraints(node.parent);
        // console.log(`FUN constraints: ${funConstraints}`);
        if (funConstraints) {
          return funConstraints.getCallConstraints().getArgType(paramIndex);
        }
      }
    } else if (nodes.isNamespaceImport(node)) {
      return node.parent && this.getNodeConstraints(node.parent);
    } else if (nodes.isImportSpecifier(node)) {
      if (node.parent) {
        const constraints = this.getNodeConstraints(node.parent);
        if (constraints) {
          const name = (node.propertyName || node.name).text;
          return constraints.getFieldConstraints(name);
        }
      }
    } else if (nodes.isNamedImports(node)) {
      return node.parent && this.getNodeConstraints(node.parent);
    } else if (nodes.isImportClause(node)) {
      if (node.parent && nodes.isImportDeclaration(node.parent)) {
        const mod = node.parent.moduleSpecifier;
        if (nodes.isStringLiteral(mod)) {
          return this.getRequireConstraints(mod.text);
        }
      }
    } else if (nodes.isIdentifier(node)) {
      const sym = this.checker.getSymbolAtLocation(node);
      if (sym) {
        const decls = sym.getDeclarations();
        // console.log(`DECLS for idend ${node.getFullText()}: ${decls &&
        // decls.length}`);
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
