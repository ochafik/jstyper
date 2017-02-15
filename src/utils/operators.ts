import * as ts from 'typescript';
import {TypeConstraints} from './type_constraints';
import * as flags from './flags';
import * as nodes from './nodes';
import {ConstraintsCache} from './constraints_cache';

export function inferBinaryOpConstraints(node: ts.BinaryExpression,
    resultType: ts.Type,
    checker: ts.TypeChecker,
    constraintsCache: ConstraintsCache) {

  const leftType = checker.getTypeAtLocation(node.left);
  const rightType = checker.getTypeAtLocation(node.right);

  const leftConstraints = constraintsCache.getNodeConstraints(node.left);
  const rightConstraints = constraintsCache.getNodeConstraints(node.right);

  const op = node.operatorToken.kind;

  switch (op) {
    case ts.SyntaxKind.InKeyword:
      leftConstraints && leftConstraints.isString();
      if (nodes.isStringLiteral(node.left)) {
        rightConstraints && rightConstraints.getComputedFieldConstraints(node.left.text).isUndefined();
      }
      break;
    // Plus operators
    case ts.SyntaxKind.PlusToken:
    case ts.SyntaxKind.PlusEqualsToken:
      if (flags.isNumber(resultType) && !flags.isString(resultType)) {
        leftConstraints && leftConstraints.isNumber();
        rightConstraints && rightConstraints.isNumber();
      }
      break;
    // Number operators.
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
    case ts.SyntaxKind.LessThanLessThanToken:
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanToken:
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.AmpersandToken:
    case ts.SyntaxKind.AmpersandEqualsToken:
    case ts.SyntaxKind.BarToken:
    case ts.SyntaxKind.BarEqualsToken:
    case ts.SyntaxKind.CaretToken:
    case ts.SyntaxKind.CaretEqualsToken:
      leftConstraints && leftConstraints.isNumber();
      rightConstraints && rightConstraints.isNumber();
      break;
    // Ordering operators
    case ts.SyntaxKind.LessThanToken:
    case ts.SyntaxKind.LessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanToken:
    case ts.SyntaxKind.GreaterThanEqualsToken:
      {
        function handle(constraints: TypeConstraints, otherType: ts.Type) {
          if (flags.isNumber(otherType) && !flags.isString(otherType)) {
            constraints.isNumber();
          } else if (flags.isString(otherType) && !flags.isNumber(otherType)) {
            constraints.isString();
          }
        }
        leftConstraints && handle(leftConstraints, rightType);
        rightConstraints && handle(rightConstraints, leftType);
      }
      break;
    // Boolean operators
    case ts.SyntaxKind.AmpersandAmpersandToken:
    case ts.SyntaxKind.BarBarToken:
      leftConstraints && leftConstraints.isBooleanLike();
      // In `a && b`, we know that `a` is bool-like but know absolutely
      // nothing about `b`.
      // But if that is embedded in `(a && b) && c`, then it's another
      // game.
      // TODO: propagate contextual type upwards.
      rightConstraints && rightConstraints.isBooleanLike();
      break;
    // Equality-like operators
    case ts.SyntaxKind.EqualsEqualsToken:
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
    case ts.SyntaxKind.ExclamationEqualsToken:
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      {
        function handle(constraints: TypeConstraints, otherType: ts.Type) {
          // if (constraints && otherType) {
            if (flags.isPrimitive(otherType)) {  //! isAny(otherType)) {
              constraints.isType(otherType);
            } else if (flags.isNull(otherType)) {
              constraints.isNullable();
            }
          // }
        }
        leftConstraints && handle(leftConstraints, rightType);
        rightConstraints && handle(rightConstraints, leftType);
      }

      if (nodes.isTypeOfExpression(node.left)) {
        const constraints = constraintsCache.getNodeConstraints(node.left.expression);
        if (constraints && nodes.isStringLiteral(node.right)) {
          switch (node.right.text) {
            case 'string':
              constraints.isString();
              break;
            case 'number':
              constraints.isNumber();
              break;
            case 'boolean':
              constraints.isBoolean();
              break;
            case 'function':
              constraints.getCallConstraints();
              break;
            case 'undefined':
              constraints.isUndefined();
              break;
            case 'symbol':
              constraints.isSymbol();
              break;
          }
        }
      }
      // leftConstraints && rightType && leftConstraints.isType(rightType);
      // rightConstraints && leftType && rightConstraints.isType(leftType);
      break;
  }

  switch (op) {
    // Assignment operators
    case ts.SyntaxKind.PlusEqualsToken:
      leftConstraints && leftConstraints.isWritable();
      break;
    case ts.SyntaxKind.EqualsToken:
    case ts.SyntaxKind.MinusEqualsToken:
    case ts.SyntaxKind.AsteriskEqualsToken:
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
    case ts.SyntaxKind.SlashEqualsToken:
    case ts.SyntaxKind.PercentEqualsToken:
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.AmpersandEqualsToken:
    case ts.SyntaxKind.BarEqualsToken:
    case ts.SyntaxKind.CaretEqualsToken:
      leftConstraints && leftConstraints.isWritable();
      leftConstraints && !flags.isAny(rightType) && leftConstraints.isType(rightType);
      break;
  }

  switch (op) {
    // Plus operators
    // case ts.SyntaxKind.PlusToken:
      // rightConstraints && flags.isNumber(leftType) && rightConstraints.isNumber();
      // break;
    case ts.SyntaxKind.PlusEqualsToken:
      leftConstraints && flags.isNumber(leftConstraints.flags) && rightConstraints && rightConstraints.isNumber();
      // rightConstraints && flags.isNumber(leftType) && rightConstraints.isNumber();
      break;
  }
  //   // handlePlusOp(leftConstraints, rightType);
  // } else if (leftConstraints && rightType && !fl.isAny(rightType)) {
  //   leftConstraints.isType(rightType);
  // }
}

export function inferUnaryOpConstraints(
    op: ts.PrefixUnaryOperator | ts.PostfixUnaryOperator,
    constraints?: TypeConstraints) {
  if (!constraints) {
    return;
  }
  switch (op) {
    case ts.SyntaxKind.PlusToken:
    case ts.SyntaxKind.PlusPlusToken:
    case ts.SyntaxKind.MinusToken:
    case ts.SyntaxKind.MinusMinusToken:
    case ts.SyntaxKind.TildeToken:
      constraints.isNumber();
      break;
    case ts.SyntaxKind.ExclamationToken:
      constraints.isBooleanLike();
      break;
  }
}

// function set<T>(values: T[]) {
//   return values.reduce((s, o) => s.add(o), new Set<T>());
// }