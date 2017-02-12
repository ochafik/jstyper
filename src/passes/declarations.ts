import * as ts from 'typescript';
import {AddChangeCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';
import {Mutator} from '../utils/mutator';

export function turnToDeclarations(
    fileNames: string[], services: ts.LanguageService,
    addChange: AddChangeCallback) {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    const fileName = sourceFile.fileName;
    const mutator = new Mutator(sourceFile.fileName, addChange);
    if (fileNames.indexOf(fileName) < 0) {
      continue;
    }

    ts.forEachChild(sourceFile, visit);

    function removeBody(node: ts.Node&{body?: ts.Node}) {
      if (node.body) {
        mutator.remove(node.body.getStart(), node.body.getEnd(), ';');
      }
    }
    function removeInitializer(
        node: ts.Node&{name: ts.Node, type?: ts.Node, initializer?: ts.Node}) {
      if (node.initializer) {
        mutator.remove(
            node.type ? node.type.getEnd() : node.name.getEnd(),
            node.initializer.getEnd());
      }
    }
    function remove(node: ts.Node) {
      mutator.remove(node.getStart(), node.getEnd());
    }

    function visit(node: ts.Node) {
      if (nodes.isFunctionLikeDeclaration(node)) {
        mutator.insert(node.getStart(), 'declare ');
        removeBody(node);
      } else if (nodes.isClassDeclaration(node)) {
        mutator.insert(node.getStart(), 'declare ');
        for (const member of node.members) {
          if (nodes.isPropertyDeclaration(member)) {
            removeInitializer(member);
          } else if (nodes.isFunctionLikeDeclaration(member)) {
            removeBody(member);
          } else {
            remove(member);
          }
        }
      } else if (
          nodes.isTypeAliasDeclaration(node) ||
          nodes.isInterfaceDeclaration(node)) {
        // Do nothing.
      } else if (nodes.isVariableStatement(node)) {
        mutator.insert(node.getStart(), 'declare ');
        ts.forEachChild(node, visit);
      } else if (nodes.isVariableDeclarationList(node)) {
        ts.forEachChild(node, visit);
      } else if (nodes.isVariableDeclaration(node)) {
        removeInitializer(node);
      } else {
        remove(node);
      }
    }
  }
}
