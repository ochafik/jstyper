import * as ts from "typescript";
import {AddChangeCallback} from './language_service_reactor';

export function format(fileNames: string[], services: ts.LanguageService, addChange: AddChangeCallback) {
  for (const fileName of fileNames) {
    services.getFormattingEditsForDocument(fileName, formattingOptions).forEach(c => addChange(fileName, c));
  }
}

const formattingOptions: ts.FormatCodeOptions = {
    IndentStyle: ts.IndentStyle.Smart,
    IndentSize: 2,
    TabSize: 2,
    BaseIndentSize: 2,
    ConvertTabsToSpaces: true,
    NewLineCharacter: '\n',
    InsertSpaceAfterCommaDelimiter: true,
    InsertSpaceAfterSemicolonInForStatements: true,
    InsertSpaceBeforeAndAfterBinaryOperators: true,
    InsertSpaceAfterConstructor: false,
    InsertSpaceAfterKeywordsInControlFlowStatements: true,
    InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    InsertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
    InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
    InsertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: true,
    InsertSpaceAfterTypeAssertion: false,
    InsertSpaceBeforeFunctionParenthesis: false,
    PlaceOpenBraceOnNewLineForFunctions: false,
    PlaceOpenBraceOnNewLineForControlBlocks: false,
}
