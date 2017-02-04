import * as ts from 'typescript';

export const equalityLikeOperators = set([
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
]);

export const unaryNumberOperators = set([
  ts.SyntaxKind.PlusPlusToken,
  ts.SyntaxKind.MinusMinusToken,
  ts.SyntaxKind.ExclamationToken,
  ts.SyntaxKind.TildeToken,
]);

export const binaryNumberOrStringOperators = set([
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.PlusEqualsToken,
]);

export const binaryNumberOperators = set([
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.LessThanLessThanToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretToken,
  ts.SyntaxKind.CaretEqualsToken,
]);

export const assignmentOperators = set([
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
]);

function set<T>(values: T[]) {
  return values.reduce((s, o) => s.add(o), new Set<T>());
}