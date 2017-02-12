import * as ts from 'typescript';

export function isFunctionLikeDeclaration(decl: ts.Node):
    decl is ts.FunctionLikeDeclaration {
  switch (decl.kind) {
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.FunctionExpression:

    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
      return true;
    default:
      return false;
  }
}

export function isEndOfFileToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.EndOfFileToken> {
  return node.kind === ts.SyntaxKind.EndOfFileToken;
}
export function isNumericLiteral(node: ts.Node): node is ts.NumericLiteral {
  return node.kind === ts.SyntaxKind.NumericLiteral;
}
export function isStringLiteral(node: ts.Node): node is ts.StringLiteral {
  return node.kind === ts.SyntaxKind.StringLiteral;
}
export function isJsxText(node: ts.Node): node is ts.JsxText {
  return node.kind === ts.SyntaxKind.JsxText;
}
export function isRegularExpressionLiteral(node: ts.Node):
    node is ts.RegularExpressionLiteral {
  return node.kind === ts.SyntaxKind.RegularExpressionLiteral;
}
export function isNoSubstitutionTemplateLiteral(node: ts.Node):
    node is ts.NoSubstitutionTemplateLiteral {
  return node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
}
export function isTemplateHead(node: ts.Node): node is ts.TemplateHead {
  return node.kind === ts.SyntaxKind.TemplateHead;
}
export function isTemplateMiddle(node: ts.Node): node is ts.TemplateMiddle {
  return node.kind === ts.SyntaxKind.TemplateMiddle;
}
export function isTemplateTail(node: ts.Node): node is ts.TemplateTail {
  return node.kind === ts.SyntaxKind.TemplateTail;
}
export function isOpenBraceToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.OpenBraceToken> {
  return node.kind === ts.SyntaxKind.OpenBraceToken;
}
export function isCloseBraceToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CloseBraceToken> {
  return node.kind === ts.SyntaxKind.CloseBraceToken;
}
export function isOpenParenToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.OpenParenToken> {
  return node.kind === ts.SyntaxKind.OpenParenToken;
}
export function isCloseParenToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CloseParenToken> {
  return node.kind === ts.SyntaxKind.CloseParenToken;
}
export function isOpenBracketToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.OpenBracketToken> {
  return node.kind === ts.SyntaxKind.OpenBracketToken;
}
export function isCloseBracketToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CloseBracketToken> {
  return node.kind === ts.SyntaxKind.CloseBracketToken;
}
export function isDotToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.DotToken> {
  return node.kind === ts.SyntaxKind.DotToken;
}
export function isDotDotDotToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.DotDotDotToken> {
  return node.kind === ts.SyntaxKind.DotDotDotToken;
}
export function isSemicolonToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.SemicolonToken> {
  return node.kind === ts.SyntaxKind.SemicolonToken;
}
export function isCommaToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CommaToken> {
  return node.kind === ts.SyntaxKind.CommaToken;
}
export function isLessThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LessThanToken> {
  return node.kind === ts.SyntaxKind.LessThanToken;
}
export function isLessThanSlashToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LessThanSlashToken> {
  return node.kind === ts.SyntaxKind.LessThanSlashToken;
}
export function isGreaterThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.GreaterThanToken> {
  return node.kind === ts.SyntaxKind.GreaterThanToken;
}
export function isLessThanEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LessThanEqualsToken> {
  return node.kind === ts.SyntaxKind.LessThanEqualsToken;
}
export function isGreaterThanEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.GreaterThanEqualsToken> {
  return node.kind === ts.SyntaxKind.GreaterThanEqualsToken;
}
export function isEqualsEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.EqualsEqualsToken> {
  return node.kind === ts.SyntaxKind.EqualsEqualsToken;
}
export function isExclamationEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.ExclamationEqualsToken> {
  return node.kind === ts.SyntaxKind.ExclamationEqualsToken;
}
export function isEqualsEqualsEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.EqualsEqualsEqualsToken> {
  return node.kind === ts.SyntaxKind.EqualsEqualsEqualsToken;
}
export function isExclamationEqualsEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.ExclamationEqualsEqualsToken> {
  return node.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
}
export function isEqualsGreaterThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.EqualsGreaterThanToken> {
  return node.kind === ts.SyntaxKind.EqualsGreaterThanToken;
}
export function isPlusToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.PlusToken> {
  return node.kind === ts.SyntaxKind.PlusToken;
}
export function isMinusToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.MinusToken> {
  return node.kind === ts.SyntaxKind.MinusToken;
}
export function isAsteriskToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AsteriskToken> {
  return node.kind === ts.SyntaxKind.AsteriskToken;
}
export function isAsteriskAsteriskToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AsteriskAsteriskToken> {
  return node.kind === ts.SyntaxKind.AsteriskAsteriskToken;
}
export function isSlashToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.SlashToken> {
  return node.kind === ts.SyntaxKind.SlashToken;
}
export function isPercentToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.PercentToken> {
  return node.kind === ts.SyntaxKind.PercentToken;
}
export function isPlusPlusToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.PlusPlusToken> {
  return node.kind === ts.SyntaxKind.PlusPlusToken;
}
export function isMinusMinusToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.MinusMinusToken> {
  return node.kind === ts.SyntaxKind.MinusMinusToken;
}
export function isLessThanLessThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LessThanLessThanToken> {
  return node.kind === ts.SyntaxKind.LessThanLessThanToken;
}
export function isGreaterThanGreaterThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.GreaterThanGreaterThanToken> {
  return node.kind === ts.SyntaxKind.GreaterThanGreaterThanToken;
}
export function isGreaterThanGreaterThanGreaterThanToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken> {
  return node.kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
}
export function isAmpersandToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AmpersandToken> {
  return node.kind === ts.SyntaxKind.AmpersandToken;
}
export function isBarToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.BarToken> {
  return node.kind === ts.SyntaxKind.BarToken;
}
export function isCaretToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CaretToken> {
  return node.kind === ts.SyntaxKind.CaretToken;
}
export function isExclamationToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.ExclamationToken> {
  return node.kind === ts.SyntaxKind.ExclamationToken;
}
export function isTildeToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.TildeToken> {
  return node.kind === ts.SyntaxKind.TildeToken;
}
export function isAmpersandAmpersandToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AmpersandAmpersandToken> {
  return node.kind === ts.SyntaxKind.AmpersandAmpersandToken;
}
export function isBarBarToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.BarBarToken> {
  return node.kind === ts.SyntaxKind.BarBarToken;
}
export function isQuestionToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.QuestionToken> {
  return node.kind === ts.SyntaxKind.QuestionToken;
}
export function isColonToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.ColonToken> {
  return node.kind === ts.SyntaxKind.ColonToken;
}
export function isAtToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AtToken> {
  return node.kind === ts.SyntaxKind.AtToken;
}
export function isEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.EqualsToken> {
  return node.kind === ts.SyntaxKind.EqualsToken;
}
export function isPlusEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.PlusEqualsToken> {
  return node.kind === ts.SyntaxKind.PlusEqualsToken;
}
export function isMinusEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.MinusEqualsToken> {
  return node.kind === ts.SyntaxKind.MinusEqualsToken;
}
export function isAsteriskEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AsteriskEqualsToken> {
  return node.kind === ts.SyntaxKind.AsteriskEqualsToken;
}
export function isAsteriskAsteriskEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AsteriskAsteriskEqualsToken> {
  return node.kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken;
}
export function isSlashEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.SlashEqualsToken> {
  return node.kind === ts.SyntaxKind.SlashEqualsToken;
}
export function isPercentEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.PercentEqualsToken> {
  return node.kind === ts.SyntaxKind.PercentEqualsToken;
}
export function isLessThanLessThanEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LessThanLessThanEqualsToken> {
  return node.kind === ts.SyntaxKind.LessThanLessThanEqualsToken;
}
export function isGreaterThanGreaterThanEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.GreaterThanGreaterThanEqualsToken> {
  return node.kind === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken;
}
export function isGreaterThanGreaterThanGreaterThanEqualsToken(node: ts.Node):
    node is
        ts.Token<ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken> {
  return node.kind ===
      ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken;
}
export function isAmpersandEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.AmpersandEqualsToken> {
  return node.kind === ts.SyntaxKind.AmpersandEqualsToken;
}
export function isBarEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.BarEqualsToken> {
  return node.kind === ts.SyntaxKind.BarEqualsToken;
}
export function isCaretEqualsToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.CaretEqualsToken> {
  return node.kind === ts.SyntaxKind.CaretEqualsToken;
}
export function isIdentifier(node: ts.Node): node is ts.Identifier {
  return node.kind === ts.SyntaxKind.Identifier;
}
export function isQualifiedName(node: ts.Node): node is ts.QualifiedName {
  return node.kind === ts.SyntaxKind.QualifiedName;
}
export function isComputedPropertyName(node: ts.Node):
    node is ts.ComputedPropertyName {
  return node.kind === ts.SyntaxKind.ComputedPropertyName;
}
export function isTypeParameter(node: ts.Node):
    node is ts.TypeParameterDeclaration {
  return node.kind === ts.SyntaxKind.TypeParameter;
}
export function isParameter(node: ts.Node): node is ts.ParameterDeclaration {
  return node.kind === ts.SyntaxKind.Parameter;
}
export function isDecorator(node: ts.Node): node is ts.Decorator {
  return node.kind === ts.SyntaxKind.Decorator;
}
export function isPropertySignature(node: ts.Node):
    node is ts.PropertySignature {
  return node.kind === ts.SyntaxKind.PropertySignature;
}
export function isPropertyDeclaration(node: ts.Node):
    node is ts.PropertyDeclaration {
  return node.kind === ts.SyntaxKind.PropertyDeclaration;
}
export function isMethodSignature(node: ts.Node): node is ts.MethodSignature {
  return node.kind === ts.SyntaxKind.MethodSignature;
}
export function isMethodDeclaration(node: ts.Node):
    node is ts.MethodDeclaration {
  return node.kind === ts.SyntaxKind.MethodDeclaration;
}
export function isConstructor(node: ts.Node):
    node is ts.ConstructorDeclaration {
  return node.kind === ts.SyntaxKind.Constructor;
}
export function isGetAccessor(node: ts.Node):
    node is ts.GetAccessorDeclaration {
  return node.kind === ts.SyntaxKind.GetAccessor;
}
export function isSetAccessor(node: ts.Node):
    node is ts.SetAccessorDeclaration {
  return node.kind === ts.SyntaxKind.SetAccessor;
}
export function isCallSignature(node: ts.Node):
    node is ts.CallSignatureDeclaration {
  return node.kind === ts.SyntaxKind.CallSignature;
}
export function isConstructSignature(node: ts.Node):
    node is ts.ConstructSignatureDeclaration {
  return node.kind === ts.SyntaxKind.ConstructSignature;
}
export function isIndexSignature(node: ts.Node):
    node is ts.IndexSignatureDeclaration {
  return node.kind === ts.SyntaxKind.IndexSignature;
}
export function isTypePredicate(node: ts.Node): node is ts.TypePredicateNode {
  return node.kind === ts.SyntaxKind.TypePredicate;
}
export function isTypeReference(node: ts.Node): node is ts.TypeReferenceNode {
  return node.kind === ts.SyntaxKind.TypeReference;
}
export function isFunctionType(node: ts.Node): node is ts.FunctionTypeNode {
  return node.kind === ts.SyntaxKind.FunctionType;
}
export function isConstructorType(node: ts.Node):
    node is ts.ConstructorTypeNode {
  return node.kind === ts.SyntaxKind.ConstructorType;
}
export function isTypeQuery(node: ts.Node): node is ts.TypeQueryNode {
  return node.kind === ts.SyntaxKind.TypeQuery;
}
export function isTypeLiteral(node: ts.Node): node is ts.TypeLiteralNode {
  return node.kind === ts.SyntaxKind.TypeLiteral;
}
export function isArrayType(node: ts.Node): node is ts.ArrayTypeNode {
  return node.kind === ts.SyntaxKind.ArrayType;
}
export function isTupleType(node: ts.Node): node is ts.TupleTypeNode {
  return node.kind === ts.SyntaxKind.TupleType;
}
export function isUnionType(node: ts.Node): node is ts.UnionTypeNode {
  return node.kind === ts.SyntaxKind.UnionType;
}
export function isIntersectionType(node: ts.Node):
    node is ts.IntersectionTypeNode {
  return node.kind === ts.SyntaxKind.IntersectionType;
}
export function isParenthesizedType(node: ts.Node):
    node is ts.ParenthesizedTypeNode {
  return node.kind === ts.SyntaxKind.ParenthesizedType;
}
export function isThisType(node: ts.Node): node is ts.ThisTypeNode {
  return node.kind === ts.SyntaxKind.ThisType;
}
export function isTypeOperator(node: ts.Node): node is ts.TypeOperatorNode {
  return node.kind === ts.SyntaxKind.TypeOperator;
}
export function isIndexedAccessType(node: ts.Node):
    node is ts.IndexedAccessTypeNode {
  return node.kind === ts.SyntaxKind.IndexedAccessType;
}
export function isMappedType(node: ts.Node): node is ts.MappedTypeNode {
  return node.kind === ts.SyntaxKind.MappedType;
}
export function isLiteralType(node: ts.Node): node is ts.LiteralTypeNode {
  return node.kind === ts.SyntaxKind.LiteralType;
}
export function isObjectBindingPattern(node: ts.Node):
    node is ts.ObjectBindingPattern {
  return node.kind === ts.SyntaxKind.ObjectBindingPattern;
}
export function isArrayBindingPattern(node: ts.Node):
    node is ts.ArrayBindingPattern {
  return node.kind === ts.SyntaxKind.ArrayBindingPattern;
}
export function isBindingElement(node: ts.Node): node is ts.BindingElement {
  return node.kind === ts.SyntaxKind.BindingElement;
}
export function isArrayLiteralExpression(node: ts.Node):
    node is ts.ArrayLiteralExpression {
  return node.kind === ts.SyntaxKind.ArrayLiteralExpression;
}
export function isObjectLiteralExpression(node: ts.Node):
    node is ts.ObjectLiteralExpression {
  return node.kind === ts.SyntaxKind.ObjectLiteralExpression;
}
export function isPropertyAccessExpression(node: ts.Node):
    node is ts.PropertyAccessExpression {
  return node.kind === ts.SyntaxKind.PropertyAccessExpression;
}
export function isElementAccessExpression(node: ts.Node):
    node is ts.ElementAccessExpression {
  return node.kind === ts.SyntaxKind.ElementAccessExpression;
}
export function isCallExpression(node: ts.Node): node is ts.CallExpression {
  return node.kind === ts.SyntaxKind.CallExpression;
}
export function isNewExpression(node: ts.Node): node is ts.NewExpression {
  return node.kind === ts.SyntaxKind.NewExpression;
}
export function isTaggedTemplateExpression(node: ts.Node):
    node is ts.TaggedTemplateExpression {
  return node.kind === ts.SyntaxKind.TaggedTemplateExpression;
}
// export function isTypeAssertionExpression(node: ts.Node): node is
// ts.TypeAssertionExpression {
//   return node.kind === ts.SyntaxKind.TypeAssertionExpression;
// }
export function isParenthesizedExpression(node: ts.Node):
    node is ts.ParenthesizedExpression {
  return node.kind === ts.SyntaxKind.ParenthesizedExpression;
}
export function isFunctionExpression(node: ts.Node):
    node is ts.FunctionExpression {
  return node.kind === ts.SyntaxKind.FunctionExpression;
}
export function isArrowFunction(node: ts.Node): node is ts.ArrowFunction {
  return node.kind === ts.SyntaxKind.ArrowFunction;
}
export function isDeleteExpression(node: ts.Node): node is ts.DeleteExpression {
  return node.kind === ts.SyntaxKind.DeleteExpression;
}
export function isTypeOfExpression(node: ts.Node): node is ts.TypeOfExpression {
  return node.kind === ts.SyntaxKind.TypeOfExpression;
}
export function isVoidExpression(node: ts.Node): node is ts.VoidExpression {
  return node.kind === ts.SyntaxKind.VoidExpression;
}
export function isAwaitExpression(node: ts.Node): node is ts.AwaitExpression {
  return node.kind === ts.SyntaxKind.AwaitExpression;
}
export function isPrefixUnaryExpression(node: ts.Node):
    node is ts.PrefixUnaryExpression {
  return node.kind === ts.SyntaxKind.PrefixUnaryExpression;
}
export function isPostfixUnaryExpression(node: ts.Node):
    node is ts.PostfixUnaryExpression {
  return node.kind === ts.SyntaxKind.PostfixUnaryExpression;
}
export function isBinaryExpression(node: ts.Node): node is ts.BinaryExpression {
  return node.kind === ts.SyntaxKind.BinaryExpression;
}
export function isConditionalExpression(node: ts.Node):
    node is ts.ConditionalExpression {
  return node.kind === ts.SyntaxKind.ConditionalExpression;
}
export function isTemplateExpression(node: ts.Node):
    node is ts.TemplateExpression {
  return node.kind === ts.SyntaxKind.TemplateExpression;
}
export function isYieldExpression(node: ts.Node): node is ts.YieldExpression {
  return node.kind === ts.SyntaxKind.YieldExpression;
}
export function isSpreadElement(node: ts.Node): node is ts.SpreadElement {
  return node.kind === ts.SyntaxKind.SpreadElement;
}
export function isClassExpression(node: ts.Node): node is ts.ClassExpression {
  return node.kind === ts.SyntaxKind.ClassExpression;
}
export function isOmittedExpression(node: ts.Node):
    node is ts.OmittedExpression {
  return node.kind === ts.SyntaxKind.OmittedExpression;
}
export function isExpressionWithTypeArguments(node: ts.Node):
    node is ts.ExpressionWithTypeArguments {
  return node.kind === ts.SyntaxKind.ExpressionWithTypeArguments;
}
export function isAsExpression(node: ts.Node): node is ts.AsExpression {
  return node.kind === ts.SyntaxKind.AsExpression;
}
export function isNonNullExpression(node: ts.Node):
    node is ts.NonNullExpression {
  return node.kind === ts.SyntaxKind.NonNullExpression;
}
export function isTemplateSpan(node: ts.Node): node is ts.TemplateSpan {
  return node.kind === ts.SyntaxKind.TemplateSpan;
}
export function isSemicolonClassElement(node: ts.Node):
    node is ts.SemicolonClassElement {
  return node.kind === ts.SyntaxKind.SemicolonClassElement;
}
export function isBlock(node: ts.Node): node is ts.Block {
  return node.kind === ts.SyntaxKind.Block;
}
export function isVariableStatement(node: ts.Node):
    node is ts.VariableStatement {
  return node.kind === ts.SyntaxKind.VariableStatement;
}
export function isEmptyStatement(node: ts.Node): node is ts.EmptyStatement {
  return node.kind === ts.SyntaxKind.EmptyStatement;
}
export function isExpressionStatement(node: ts.Node):
    node is ts.ExpressionStatement {
  return node.kind === ts.SyntaxKind.ExpressionStatement;
}
export function isIfStatement(node: ts.Node): node is ts.IfStatement {
  return node.kind === ts.SyntaxKind.IfStatement;
}
export function isDoStatement(node: ts.Node): node is ts.DoStatement {
  return node.kind === ts.SyntaxKind.DoStatement;
}
export function isWhileStatement(node: ts.Node): node is ts.WhileStatement {
  return node.kind === ts.SyntaxKind.WhileStatement;
}
export function isForStatement(node: ts.Node): node is ts.ForStatement {
  return node.kind === ts.SyntaxKind.ForStatement;
}
export function isForInStatement(node: ts.Node): node is ts.ForInStatement {
  return node.kind === ts.SyntaxKind.ForInStatement;
}
export function isForOfStatement(node: ts.Node): node is ts.ForOfStatement {
  return node.kind === ts.SyntaxKind.ForOfStatement;
}
export function isContinueStatement(node: ts.Node):
    node is ts.ContinueStatement {
  return node.kind === ts.SyntaxKind.ContinueStatement;
}
export function isBreakStatement(node: ts.Node): node is ts.BreakStatement {
  return node.kind === ts.SyntaxKind.BreakStatement;
}
export function isReturnStatement(node: ts.Node): node is ts.ReturnStatement {
  return node.kind === ts.SyntaxKind.ReturnStatement;
}
export function isWithStatement(node: ts.Node): node is ts.WithStatement {
  return node.kind === ts.SyntaxKind.WithStatement;
}
export function isSwitchStatement(node: ts.Node): node is ts.SwitchStatement {
  return node.kind === ts.SyntaxKind.SwitchStatement;
}
export function isLabeledStatement(node: ts.Node): node is ts.LabeledStatement {
  return node.kind === ts.SyntaxKind.LabeledStatement;
}
export function isThrowStatement(node: ts.Node): node is ts.ThrowStatement {
  return node.kind === ts.SyntaxKind.ThrowStatement;
}
export function isTryStatement(node: ts.Node): node is ts.TryStatement {
  return node.kind === ts.SyntaxKind.TryStatement;
}
export function isDebuggerStatement(node: ts.Node):
    node is ts.DebuggerStatement {
  return node.kind === ts.SyntaxKind.DebuggerStatement;
}
export function isVariableDeclaration(node: ts.Node):
    node is ts.VariableDeclaration {
  return node.kind === ts.SyntaxKind.VariableDeclaration;
}
export function isVariableDeclarationList(node: ts.Node):
    node is ts.VariableDeclarationList {
  return node.kind === ts.SyntaxKind.VariableDeclarationList;
}
export function isFunctionDeclaration(node: ts.Node):
    node is ts.FunctionDeclaration {
  return node.kind === ts.SyntaxKind.FunctionDeclaration;
}
export function isClassDeclaration(node: ts.Node): node is ts.ClassDeclaration {
  return node.kind === ts.SyntaxKind.ClassDeclaration;
}
export function isInterfaceDeclaration(node: ts.Node):
    node is ts.InterfaceDeclaration {
  return node.kind === ts.SyntaxKind.InterfaceDeclaration;
}
export function isTypeAliasDeclaration(node: ts.Node):
    node is ts.TypeAliasDeclaration {
  return node.kind === ts.SyntaxKind.TypeAliasDeclaration;
}
export function isEnumDeclaration(node: ts.Node): node is ts.EnumDeclaration {
  return node.kind === ts.SyntaxKind.EnumDeclaration;
}
export function isModuleDeclaration(node: ts.Node):
    node is ts.ModuleDeclaration {
  return node.kind === ts.SyntaxKind.ModuleDeclaration;
}
export function isModuleBlock(node: ts.Node): node is ts.ModuleBlock {
  return node.kind === ts.SyntaxKind.ModuleBlock;
}
export function isCaseBlock(node: ts.Node): node is ts.CaseBlock {
  return node.kind === ts.SyntaxKind.CaseBlock;
}
export function isNamespaceExportDeclaration(node: ts.Node):
    node is ts.NamespaceExportDeclaration {
  return node.kind === ts.SyntaxKind.NamespaceExportDeclaration;
}
export function isImportEqualsDeclaration(node: ts.Node):
    node is ts.ImportEqualsDeclaration {
  return node.kind === ts.SyntaxKind.ImportEqualsDeclaration;
}
export function isImportDeclaration(node: ts.Node):
    node is ts.ImportDeclaration {
  return node.kind === ts.SyntaxKind.ImportDeclaration;
}
export function isImportClause(node: ts.Node): node is ts.ImportClause {
  return node.kind === ts.SyntaxKind.ImportClause;
}
export function isNamespaceImport(node: ts.Node): node is ts.NamespaceImport {
  return node.kind === ts.SyntaxKind.NamespaceImport;
}
export function isNamedImports(node: ts.Node): node is ts.NamedImports {
  return node.kind === ts.SyntaxKind.NamedImports;
}
export function isImportSpecifier(node: ts.Node): node is ts.ImportSpecifier {
  return node.kind === ts.SyntaxKind.ImportSpecifier;
}
export function isExportAssignment(node: ts.Node): node is ts.ExportAssignment {
  return node.kind === ts.SyntaxKind.ExportAssignment;
}
export function isExportDeclaration(node: ts.Node):
    node is ts.ExportDeclaration {
  return node.kind === ts.SyntaxKind.ExportDeclaration;
}
export function isNamedExports(node: ts.Node): node is ts.NamedExports {
  return node.kind === ts.SyntaxKind.NamedExports;
}
export function isExportSpecifier(node: ts.Node): node is ts.ExportSpecifier {
  return node.kind === ts.SyntaxKind.ExportSpecifier;
}
export function isMissingDeclaration(node: ts.Node):
    node is ts.MissingDeclaration {
  return node.kind === ts.SyntaxKind.MissingDeclaration;
}
export function isExternalModuleReference(node: ts.Node):
    node is ts.ExternalModuleReference {
  return node.kind === ts.SyntaxKind.ExternalModuleReference;
}
export function isJsxElement(node: ts.Node): node is ts.JsxElement {
  return node.kind === ts.SyntaxKind.JsxElement;
}
export function isJsxSelfClosingElement(node: ts.Node):
    node is ts.JsxSelfClosingElement {
  return node.kind === ts.SyntaxKind.JsxSelfClosingElement;
}
export function isJsxOpeningElement(node: ts.Node):
    node is ts.JsxOpeningElement {
  return node.kind === ts.SyntaxKind.JsxOpeningElement;
}
export function isJsxClosingElement(node: ts.Node):
    node is ts.JsxClosingElement {
  return node.kind === ts.SyntaxKind.JsxClosingElement;
}
export function isJsxAttribute(node: ts.Node): node is ts.JsxAttribute {
  return node.kind === ts.SyntaxKind.JsxAttribute;
}
export function isJsxSpreadAttribute(node: ts.Node):
    node is ts.JsxSpreadAttribute {
  return node.kind === ts.SyntaxKind.JsxSpreadAttribute;
}
export function isJsxExpression(node: ts.Node): node is ts.JsxExpression {
  return node.kind === ts.SyntaxKind.JsxExpression;
}
export function isCaseClause(node: ts.Node): node is ts.CaseClause {
  return node.kind === ts.SyntaxKind.CaseClause;
}
export function isDefaultClause(node: ts.Node): node is ts.DefaultClause {
  return node.kind === ts.SyntaxKind.DefaultClause;
}
export function isHeritageClause(node: ts.Node): node is ts.HeritageClause {
  return node.kind === ts.SyntaxKind.HeritageClause;
}
export function isCatchClause(node: ts.Node): node is ts.CatchClause {
  return node.kind === ts.SyntaxKind.CatchClause;
}
export function isPropertyAssignment(node: ts.Node):
    node is ts.PropertyAssignment {
  return node.kind === ts.SyntaxKind.PropertyAssignment;
}
export function isShorthandPropertyAssignment(node: ts.Node):
    node is ts.ShorthandPropertyAssignment {
  return node.kind === ts.SyntaxKind.ShorthandPropertyAssignment;
}
export function isSpreadAssignment(node: ts.Node): node is ts.SpreadAssignment {
  return node.kind === ts.SyntaxKind.SpreadAssignment;
}
export function isEnumMember(node: ts.Node): node is ts.EnumMember {
  return node.kind === ts.SyntaxKind.EnumMember;
}
export function isSourceFile(node: ts.Node): node is ts.SourceFile {
  return node.kind === ts.SyntaxKind.SourceFile;
}
export function isJSDocTypeExpression(node: ts.Node):
    node is ts.JSDocTypeExpression {
  return node.kind === ts.SyntaxKind.JSDocTypeExpression;
}
export function isJSDocAllType(node: ts.Node): node is ts.JSDocAllType {
  return node.kind === ts.SyntaxKind.JSDocAllType;
}
export function isJSDocUnknownType(node: ts.Node): node is ts.JSDocUnknownType {
  return node.kind === ts.SyntaxKind.JSDocUnknownType;
}
export function isJSDocArrayType(node: ts.Node): node is ts.JSDocArrayType {
  return node.kind === ts.SyntaxKind.JSDocArrayType;
}
export function isJSDocUnionType(node: ts.Node): node is ts.JSDocUnionType {
  return node.kind === ts.SyntaxKind.JSDocUnionType;
}
export function isJSDocTupleType(node: ts.Node): node is ts.JSDocTupleType {
  return node.kind === ts.SyntaxKind.JSDocTupleType;
}
export function isJSDocNullableType(node: ts.Node):
    node is ts.JSDocNullableType {
  return node.kind === ts.SyntaxKind.JSDocNullableType;
}
export function isJSDocNonNullableType(node: ts.Node):
    node is ts.JSDocNonNullableType {
  return node.kind === ts.SyntaxKind.JSDocNonNullableType;
}
export function isJSDocRecordType(node: ts.Node): node is ts.JSDocRecordType {
  return node.kind === ts.SyntaxKind.JSDocRecordType;
}
export function isJSDocRecordMember(node: ts.Node):
    node is ts.JSDocRecordMember {
  return node.kind === ts.SyntaxKind.JSDocRecordMember;
}
export function isJSDocTypeReference(node: ts.Node):
    node is ts.JSDocTypeReference {
  return node.kind === ts.SyntaxKind.JSDocTypeReference;
}
export function isJSDocOptionalType(node: ts.Node):
    node is ts.JSDocOptionalType {
  return node.kind === ts.SyntaxKind.JSDocOptionalType;
}
export function isJSDocFunctionType(node: ts.Node):
    node is ts.JSDocFunctionType {
  return node.kind === ts.SyntaxKind.JSDocFunctionType;
}
export function isJSDocVariadicType(node: ts.Node):
    node is ts.JSDocVariadicType {
  return node.kind === ts.SyntaxKind.JSDocVariadicType;
}
export function isJSDocConstructorType(node: ts.Node):
    node is ts.JSDocConstructorType {
  return node.kind === ts.SyntaxKind.JSDocConstructorType;
}
export function isJSDocThisType(node: ts.Node): node is ts.JSDocThisType {
  return node.kind === ts.SyntaxKind.JSDocThisType;
}
// export function isJSDocComment(node: ts.Node): node is ts.JSDocComment {
//   return node.kind === ts.SyntaxKind.JSDocComment;
// }
export function isJSDocTag(node: ts.Node): node is ts.JSDocTag {
  return node.kind === ts.SyntaxKind.JSDocTag;
}
export function isJSDocAugmentsTag(node: ts.Node): node is ts.JSDocAugmentsTag {
  return node.kind === ts.SyntaxKind.JSDocAugmentsTag;
}
export function isJSDocParameterTag(node: ts.Node):
    node is ts.JSDocParameterTag {
  return node.kind === ts.SyntaxKind.JSDocParameterTag;
}
export function isJSDocReturnTag(node: ts.Node): node is ts.JSDocReturnTag {
  return node.kind === ts.SyntaxKind.JSDocReturnTag;
}
export function isJSDocTypeTag(node: ts.Node): node is ts.JSDocTypeTag {
  return node.kind === ts.SyntaxKind.JSDocTypeTag;
}
export function isJSDocTemplateTag(node: ts.Node): node is ts.JSDocTemplateTag {
  return node.kind === ts.SyntaxKind.JSDocTemplateTag;
}
export function isJSDocTypedefTag(node: ts.Node): node is ts.JSDocTypedefTag {
  return node.kind === ts.SyntaxKind.JSDocTypedefTag;
}
export function isJSDocPropertyTag(node: ts.Node): node is ts.JSDocPropertyTag {
  return node.kind === ts.SyntaxKind.JSDocPropertyTag;
}
export function isJSDocTypeLiteral(node: ts.Node): node is ts.JSDocTypeLiteral {
  return node.kind === ts.SyntaxKind.JSDocTypeLiteral;
}
export function isJSDocLiteralType(node: ts.Node): node is ts.JSDocLiteralType {
  return node.kind === ts.SyntaxKind.JSDocLiteralType;
}
// export function isJSDocNullKeyword(node: ts.Node): node is
// ts.JSDocNullKeyword {
//   return node.kind === ts.SyntaxKind.JSDocNullKeyword;
// }
// export function isJSDocUndefinedKeyword(node: ts.Node): node is
// ts.JSDocUndefinedKeyword {
//   return node.kind === ts.SyntaxKind.JSDocUndefinedKeyword;
// }
// export function isJSDocNeverKeyword(node: ts.Node): node is
// ts.JSDocNeverKeyword {
//   return node.kind === ts.SyntaxKind.JSDocNeverKeyword;
// }
export function isSyntaxList(node: ts.Node): node is ts.SyntaxList {
  return node.kind === ts.SyntaxKind.SyntaxList;
}
// export function isNotEmittedStatement(node: ts.Node): node is
// ts.NotEmittedStatement {
//   return node.kind === ts.SyntaxKind.NotEmittedStatement;
// }
// export function isPartiallyEmittedExpression(node: ts.Node): node is
// ts.PartiallyEmittedExpression {
//   return node.kind === ts.SyntaxKind.PartiallyEmittedExpression;
// }
// export function isMergeDeclarationMarker(node: ts.Node): node is
// ts.MergeDeclarationMarker {
//   return node.kind === ts.SyntaxKind.MergeDeclarationMarker;
// }
// export function isEndOfDeclarationMarker(node: ts.Node): node is
// ts.EndOfDeclarationMarker {
//   return node.kind === ts.SyntaxKind.EndOfDeclarationMarker;
// }
// export function isCount(node: ts.Node): node is ts.Count {
//   return node.kind === ts.SyntaxKind.Count;
// }
// export function isFirstAssignment(node: ts.Node): node is ts.FirstAssignment
// {
//   return node.kind === ts.SyntaxKind.FirstAssignment;
// }
// export function isLastAssignment(node: ts.Node): node is ts.LastAssignment {
//   return node.kind === ts.SyntaxKind.LastAssignment;
// }
// export function isFirstCompoundAssignment(node: ts.Node): node is
// ts.FirstCompoundAssignment {
//   return node.kind === ts.SyntaxKind.FirstCompoundAssignment;
// }
// export function isLastCompoundAssignment(node: ts.Node): node is
// ts.LastCompoundAssignment {
//   return node.kind === ts.SyntaxKind.LastCompoundAssignment;
// }
// export function isFirstReservedWord(node: ts.Node): node is
// ts.FirstReservedWord {
//   return node.kind === ts.SyntaxKind.FirstReservedWord;
// }
// export function isLastReservedWord(node: ts.Node): node is
// ts.LastReservedWord {
//   return node.kind === ts.SyntaxKind.LastReservedWord;
// }
// export function isFirstKeyword(node: ts.Node): node is ts.FirstKeyword {
//   return node.kind === ts.SyntaxKind.FirstKeyword;
// }
// export function isLastKeyword(node: ts.Node): node is ts.LastKeyword {
//   return node.kind === ts.SyntaxKind.LastKeyword;
// }
// export function isFirstFutureReservedWord(node: ts.Node): node is
// ts.FirstFutureReservedWord {
//   return node.kind === ts.SyntaxKind.FirstFutureReservedWord;
// }
// export function isLastFutureReservedWord(node: ts.Node): node is
// ts.LastFutureReservedWord {
//   return node.kind === ts.SyntaxKind.LastFutureReservedWord;
// }
// export function isFirstTypeNode(node: ts.Node): node is ts.FirstTypeNode {
//   return node.kind === ts.SyntaxKind.FirstTypeNode;
// }
// export function isLastTypeNode(node: ts.Node): node is ts.LastTypeNode {
//   return node.kind === ts.SyntaxKind.LastTypeNode;
// }
// export function isFirstPunctuation(node: ts.Node): node is
// ts.FirstPunctuation {
//   return node.kind === ts.SyntaxKind.FirstPunctuation;
// }
// export function isLastPunctuation(node: ts.Node): node is ts.LastPunctuation
// {
//   return node.kind === ts.SyntaxKind.LastPunctuation;
// }
export function isFirstToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.FirstToken> {
  return node.kind === ts.SyntaxKind.FirstToken;
}
export function isLastToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LastToken> {
  return node.kind === ts.SyntaxKind.LastToken;
}
export function isFirstTriviaToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.FirstTriviaToken> {
  return node.kind === ts.SyntaxKind.FirstTriviaToken;
}
export function isLastTriviaToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LastTriviaToken> {
  return node.kind === ts.SyntaxKind.LastTriviaToken;
}
export function isFirstLiteralToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.FirstLiteralToken> {
  return node.kind === ts.SyntaxKind.FirstLiteralToken;
}
export function isLastLiteralToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LastLiteralToken> {
  return node.kind === ts.SyntaxKind.LastLiteralToken;
}
export function isFirstTemplateToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.FirstTemplateToken> {
  return node.kind === ts.SyntaxKind.FirstTemplateToken;
}
export function isLastTemplateToken(node: ts.Node):
    node is ts.Token<ts.SyntaxKind.LastTemplateToken> {
  return node.kind === ts.SyntaxKind.LastTemplateToken;
}
// export function isFirstBinaryOperator(node: ts.Node): node is
// ts.FirstBinaryOperator {
//   return node.kind === ts.SyntaxKind.FirstBinaryOperator;
// }
// export function isLastBinaryOperator(node: ts.Node): node is
// ts.LastBinaryOperator {
//   return node.kind === ts.SyntaxKind.LastBinaryOperator;
// }
// export function isFirstNode(node: ts.Node): node is ts.FirstNode {
//   return node.kind === ts.SyntaxKind.FirstNode;
// }
// export function isFirstJSDocNode(node: ts.Node): node is ts.FirstJSDocNode {
//   return node.kind === ts.SyntaxKind.FirstJSDocNode;
// }
// export function isLastJSDocNode(node: ts.Node): node is ts.LastJSDocNode {
//   return node.kind === ts.SyntaxKind.LastJSDocNode;
// }
// export function isFirstJSDocTagNode(node: ts.Node): node is
// ts.FirstJSDocTagNode {
//   return node.kind === ts.SyntaxKind.FirstJSDocTagNode;
// }
// export function isLastJSDocTagNode(node: ts.Node): node is
// ts.LastJSDocTagNode {
//   return node.kind === ts.SyntaxKind.LastJSDocTagNode;
// }