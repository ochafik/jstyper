import * as ts from 'typescript';

import {Options} from '../options';
import * as fl from '../utils/flags';
import {AddChangeCallback, AddRequirementCallback, ReactorCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';
import * as ops from '../utils/operators';
import {CallConstraints, TypeConstraints} from '../utils/type_constraints';

// TODO: check if a constraint has seen any new info, then as long as some do,
// do our own loop to avoid writing files.
export function applyConstraints(
    allConstraints: Map<ts.Symbol, TypeConstraints>,
    requireConstraints: Map<string, TypeConstraints>,
    checker: ts.TypeChecker,
    _addChange: AddChangeCallback,
    addRequirement: AddRequirementCallback) {
  function addChange(sourceFile: ts.SourceFile, change: ts.TextChange) {
    if (change.span.length > 0) {
      const source = sourceFile.getFullText();
      const existing = source.substr(change.span.start, change.span.length);
      if (existing == change.newText) {
        return;
      }
    }
    _addChange(sourceFile.fileName, change);
  }

  for (const [moduleName, constraints] of requireConstraints) {
    let decls = `declare module "${moduleName}" {\n`;
    
    for (const [field, fieldConstraints] of [...constraints.fields, ...constraints.computedFields]) {
      // const fieldConstraints = constraints.getFieldConstraints(field);
      if (fieldConstraints.isPureFunction) {
        const [argList, retType] = fieldConstraints.resolveCallableArgListAndReturnType()!;
        if (fieldConstraints.getCallConstraints().constructible) {
          decls += `  export class ${field} {\n    constructor(${argList});\n  }\n`;  
        } else {
          decls += `  export function ${field}(${argList}): ${retType};\n`;  
        }
      } else {
        const resolved = fieldConstraints.resolve() || 'any';
        decls += `  export ${fieldConstraints.writable ? 'let' : 'const'} ${field}: ${resolved};\n`;
      }
    }

    decls += '}\n';
    addRequirement(moduleName, decls);
  }
  for (const [sym, constraints] of allConstraints) {
    //   if (!constraints.hasChanges) {
    //     //   console.log(`No changes for symbol
    //     ${checker.symbolToString(sym)}`);
    //       continue;
    //   }
    const decls = sym.getDeclarations();
    if (!decls || decls.length == 0) {
      continue;
    }
    let [decl] = decls;

    if (nodes.isParameter(decl) || nodes.isVariableDeclaration(decl)) {
      handleVarConstraints(constraints, decl);
    } else if (nodes.isFunctionLikeDeclaration(decl)) {
      const funDecl = decl;
      if (constraints.hasCallConstraints) {
        const callConstraints = constraints.getCallConstraints();
        // TODO: if (callConstraints.constructible)
        callConstraints.argTypes.forEach((argConstraints, i) => {
          const param = funDecl.parameters[i];
          if (param) {
            handleVarConstraints(argConstraints, param);
          }
        });
        if (!nodes.isArrowFunction(decl)) {
          handleReturnType(callConstraints.returnType, funDecl);
        }
      }
    }

    function handleReturnType(
        constraints: TypeConstraints, fun: ts.FunctionLikeDeclaration) {
      // if (!constraints.hasChanges) {
      //     return;
      // }
      const resolved = constraints.resolve();
      if (!resolved) {
        return;
      }
      let start: number;
      let length: number;
      let pre: string;
      if (fun.type) {
        start = fun.type.getStart();
        length = fun.type.getEnd() - start;
        pre = '';
      } else {
        if (fun.body) {
          start = fun.body.getStart() - 1;
        } else {
          start = fun.end;
        }
        length = 0;
        pre = ': ';
      }
      addChange(
          fun.getSourceFile(),
          {span: {start: start, length: length}, newText: pre + resolved});
    }

    function handleVarConstraints(
        constraints: TypeConstraints,
        varDecl: ts.ParameterDeclaration|ts.VariableDeclaration) {
      //   if (!constraints.hasChanges) {
      //       return;
      //   }
      // const resolved = constraints.resolve();
      let {isUndefined, resolved} = nodes.isParameter(varDecl)
          ? constraints.resolveMaybeUndefined()
          : {isUndefined: false, resolved: constraints.resolve()};

      if (resolved == null) {
        if (isUndefined) {
          resolved = 'any';
        } else {
          return;
        }
      }
      const newText = (isUndefined ? '?: ' : ': ') + resolved;

      const start = varDecl.name.getEnd();
      const length = varDecl.type ?  varDecl.type.getEnd() - start : 0;
      addChange(
          decl.getSourceFile(),
          {span: {start: start, length: length}, newText});
    }
  }
}
