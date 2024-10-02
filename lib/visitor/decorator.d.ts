import { PathTransformVisitor } from "./transformer.js";
import { ClassDeclaration, FieldDeclaration, MethodDeclaration, Parser, VariableDeclaration, InterfaceDeclaration, FunctionDeclaration, Source, DecoratorNode, DeclarationStatement } from "assemblyscript/dist/assemblyscript.js";
export declare function registerDecorator(decorator: DecoratorVisitor): typeof TopLevelDecorator;
interface DecoratorVisitor extends PathTransformVisitor {
    decoratorMatcher: (node: DecoratorNode) => boolean;
    sourceFilter: (s: Source) => boolean;
}
export declare class TopLevelDecorator extends PathTransformVisitor {
    private static _visitor;
    static registerVisitor(visitor: DecoratorVisitor): void;
    private get visitor();
    visitInterfaceDeclaration(node: InterfaceDeclaration): void;
    afterParse(parser: Parser): void;
}
export declare abstract class Decorator extends PathTransformVisitor {
    /**
     * Default filter that removes library files
     */
    get sourceFilter(): (s: Source) => boolean;
    get decoratorMatcher(): (node: DecoratorNode) => boolean;
    get name(): string;
    getDecorator(node: DeclarationStatement): DecoratorNode | null;
}
export declare abstract class ClassDecorator extends Decorator {
    abstract visitFieldDeclaration(node: FieldDeclaration): void;
    abstract visitMethodDeclaration(node: MethodDeclaration): void;
    abstract visitClassDeclaration(node: ClassDeclaration): void;
}
export declare abstract class FunctionDecorator extends Decorator {
    abstract visitFunctionDeclaration(node: FunctionDeclaration): void;
}
export declare abstract class VariableDecorator extends Decorator {
    abstract visitVariableDeclaration(node: VariableDeclaration): void;
}
export {};
