import * as ts from "typescript";
import {AddChangeCallback} from '../utils/language_service_reactor';
import {traverse} from '../utils/nodes';

export function turnToDeclarations(fileNames: string[], services: ts.LanguageService, addChange: AddChangeCallback) {
  
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    const fileName = sourceFile.fileName;
    const mutator = new Mutator(sourceFile.fileName, addChange);
    if (fileNames.indexOf(fileName) < 0) {
      continue;
    }

    ts.forEachChild(sourceFile, visit);

    function removeBody(node: ts.Node & {body?: ts.Node}) {
      if (node.body) {
          mutator.remove(node.body.getStart(), node.body.getEnd(), ';');
      }
    }
    function removeInitializer(node: ts.Node & {name: ts.Node, type?: ts.Node, initializer?: ts.Node}) {
      if (node.initializer) {
          mutator.remove(node.type ? node.type.getEnd() : node.name.getEnd(), node.initializer.getEnd());
      }
    }
    function remove(node: ts.Node) {
      mutator.remove(node.getStart(), node.getEnd());
    }
    
    function visit(node: ts.Node) {
      // ts.forEachChild(node, visit);
      
      switch (node.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
          mutator.insert(node.getStart(), 'declare ');
          removeBody(<ts.FunctionDeclaration>node);
          break;
        case ts.SyntaxKind.ClassDeclaration:
          mutator.insert(node.getStart(), 'declare ');
          
          const classDecl = <ts.ClassDeclaration>node;
          for (const member of classDecl.members) {
            if (member.kind == ts.SyntaxKind.PropertyDeclaration) {
              removeInitializer(<ts.PropertyDeclaration>member);
            } else if (member.kind == ts.SyntaxKind.MethodDeclaration ||
                member.kind == ts.SyntaxKind.Constructor) {
              removeBody(<ts.MethodDeclaration | ts.ConstructorDeclaration>member);
            } else {
              remove(member);
            }
          }
          break;
        case ts.SyntaxKind.VariableStatement:
          mutator.insert(node.getStart(), 'declare ');
          ts.forEachChild(node, visit);
          break;
        case ts.SyntaxKind.VariableDeclarationList:
          ts.forEachChild(node, visit);
          break;
        case ts.SyntaxKind.VariableDeclaration:
          removeInitializer(<ts.VariableDeclaration>node);
          break;
        case ts.SyntaxKind.ExpressionStatement:
          visit((<ts.ExpressionStatement>node).expression);
          break;
        default:
          remove(node);
      }
    }
  }
}

class Mutator {
  constructor(private fileName: string, private addChange: AddChangeCallback) {}

  insert(start: number, newText: string) {
    this.addChange(this.fileName, {
      span: {start: start, length: 0},
      newText: newText
    });
  }

  remove(start: number, end: number, newText: string = '') {
    this.addChange(this.fileName, {
      span: {start: start, length: end - start},
      newText: newText
    });
  }
}