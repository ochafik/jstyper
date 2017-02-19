import * as ts from 'typescript';

import {Options} from '../options';
import * as fl from '../utils/flags';
import * as nodes from '../utils/nodes';
import {TypeConstraints} from '../utils/type_constraints';

export class ConstraintsCache {
  allConstraints = new Map<ts.Symbol, TypeConstraints>();
  requireConstraints = new Map<string, TypeConstraints>();

  constructor(
      private services: ts.LanguageService, private options: Options,
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

  private getSymbolConstraints(sym?: ts.Symbol): TypeConstraints | undefined {
    if (!sym) {
      return undefined;
    }
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

    const getModuleSymbol = (importClause: ts.ImportClause) => {
      if (nodes.isImportDeclaration(importClause.parent)) {
        const importDecl = importClause.parent;
        return this.checker.getSymbolAtLocation(importDecl.moduleSpecifier);
      }
      return undefined;
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
      // this.checker.getSymbolAtLocation(node);
      return this.getSymbolConstraints(node['symbol']);
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
//     } else if (nodes.isNamespaceImport(node)) {
//       return node.parent && this.getNodeConstraints(node.parent) ||
//           this.getSymbolConstraintsAtLocation(node);
    } else if (nodes.isImportSpecifier(node)) {
      if (nodes.isNamedImports(node.parent)) {
        const namedImports = node.parent;
        if (nodes.isImportClause(namedImports.parent)) {
          const modSym = getModuleSymbol(namedImports.parent);
          if (modSym && modSym.exports && nodes.isIdentifier(node.name)) {
            const sym = modSym.exports[node.name.text];
            return this.getSymbolConstraints(sym);
          }
        }
      }
    } else if (nodes.isNamespaceImport(node)) {
        if (nodes.isImportClause(node.parent)) {
          const modSym = getModuleSymbol(node.parent);
          if (modSym && modSym.exports) {
            if ('default' in modSym.exports) {
              return this.getSymbolConstraints(modSym.exports['default']);
            } else {
              const constraints = new TypeConstraints(`(module '${this.checker.symbolToString(modSym)}')`,
                  this.services, this.checker, {...this.options, differentiateComputedProperties: false});
              for (const key in modSym.exports) {
                const exp = modSym.exports[key];
                const symConstraints = this.getSymbolConstraints(exp);
                if (symConstraints) {
                  constraints.fields.set(key, symConstraints);
                }
              }
              return constraints;
            }
          }
        }
    } else if (nodes.isIdentifier(node)) {
      const sym = this.checker.getSymbolAtLocation(node) || node['symbol'] as ts.Symbol;
      if (sym) {
        const decls = sym.getDeclarations();
        // console.log(`DECLS for idend ${node.getFullText()}: ${decls &&
        // decls.length}`);
        if (decls) {
          for (const decl of decls) {
            const constraints = this.getNodeConstraints(decl);
            if (constraints) {
              return constraints;
            }
          }
        }
      }
    }

    return this.getContextualNodeConstraints(node);
  }
  
  getContextualNodeConstraints(node: ts.Node) {
    if (node.parent) {
      if (nodes.isReturnStatement(node.parent)) {
        if (node === node.parent.expression) {
          const enclosingCallable = nodes.findParent(node.parent, nodes.isFunctionLikeDeclaration);
          if (enclosingCallable) {
            const constraints = this.getNodeConstraints(enclosingCallable);
            if (constraints) {
              return constraints.getCallConstraints().returnType;
            }
          }
        }
      } else if (nodes.isVariableDeclaration(node.parent) || nodes.isPropertyAssignment(node.parent)) {
        if (node === node.parent.initializer) {
          return this.getNodeConstraints(node.parent);
        }
      }
    }
    return undefined;
  }
}
