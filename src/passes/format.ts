import * as ts from 'typescript';
import {ReactorCallback} from '../utils/language_service_reactor';

export const format: ReactorCallback = (fileNames, services, addChange, _) => {
  for (const fileName of fileNames) {
    services.getFormattingEditsForDocument(fileName, formattingOptions)
        .forEach(c => addChange(fileName, c));
  }
};

const formattingOptions: ts.FormatCodeOptions = {
  IndentStyle: ts.IndentStyle.Smart,
  IndentSize: 2,
  TabSize: 2,
  BaseIndentSize: 0,
  ConvertTabsToSpaces: true,
  NewLineCharacter: '\n',
  InsertSpaceAfterCommaDelimiter: true,
  InsertSpaceAfterSemicolonInForStatements: true,
  InsertSpaceBeforeAndAfterBinaryOperators: true,
  InsertSpaceAfterConstructor: false,
  InsertSpaceAfterKeywordsInControlFlowStatements: true,
  InsertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
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
