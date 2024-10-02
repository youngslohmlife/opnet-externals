import {
  InterfaceDeclaration,
  IdentifierExpression,
  Node,
  MethodDeclaration,
  TypeNode,
  ClassDeclaration,
  Expression,
  Token,
  IndexSignature,
  ElementAccessExpression,
  ClassExpression,
  ExpressionStatement,
  ArrayLiteralExpression,
  FieldDeclaration,
  Statement,
  BinaryExpression,
  VariableStatement,
  TypeParameterNode,
  TypeName,
  TypeDeclaration,
  ObjectLiteralExpression,
  FunctionDeclaration,
  Parser,
  Source,
  FunctionExpression,
  FunctionTypeNode,
  ParameterNode,
  DeclarationStatement,
} from "assemblyscript/dist/assemblyscript.js";
import { cloneNode, toString, getName } from "visitor-as/dist/utils.js";
import {
  TransformVisitor,
  SimpleParser
} from "visitor-as/dist/index.js";

const DEBUG = process.env.OPNET_EXTERNALS_DEBUG;

const ln = (v) => {
  if (DEBUG) console.log(v);
  return v;
};

class LessSimpleParser extends SimpleParser {
  static parseClassDeclaration(s: string): ClassDeclaration {
    const tn = (this as any).getTokenizer(s);
    tn.next();
    const res = new Parser().parseClassOrInterface(tn, 0, [], tn.pos || 0);
    if (res == null) {
        throw new Error("Failed to parse the expression: '" + s + "'");
    }
    return res as ClassDeclaration;
  }
}


const buildTypeName = (v) => {
  let identifier = v.name.identifier.text;
  if (identifier === 'Address') identifier = 'public.Address';
  return identifier + (v.typeArguments.length === 0 ? '' : '<' + v.typeArguments.map((v) => buildTypeName(v)).join(', ') + '>');
};

class Parameter {
  public name: string;
  public typeName: string;
  constructor(name: string, typeName: string) {
    this.name = name;
    this.typeName = typeName;
  }
  static fromNode(node: ParameterNode): Parameter {
    return new Parameter(toString(node.name), buildTypeName(node.type));
  }
}

class CallableMethod {
  public name: string;
  public parameters: Parameter[];
  public returnType: string;
  constructor(name: string, parameters: Parameter[], returnType: string) {
    this.name = name;
    this.parameters = parameters;
    this.returnType = returnType;
  }
  static fromNode(node: MethodDeclaration): CallableMethod {
    return new CallableMethod(
      toString(node.name),
      CallableMethod.parametersFromSignature(node.signature),
      CallableMethod.returnTypeFromSignature(node.signature),
    );
  }
  static parametersFromSignature(node: FunctionTypeNode): Parameter[] {
    return node.parameters.map((v) => Parameter.fromNode(v));
  }
  static returnTypeFromSignature(node: FunctionTypeNode): string {
    return (node as any).returnType.name.identifier.text as string;
  }
}

class CallableClass {
  public name: string;
  public methods: CallableMethod[];
  constructor(name: string, methods: CallableMethod[]) {
    this.name = name;
    this.methods = methods;
  }
  static fromNode(node: InterfaceDeclaration): CallableClass {
    return new CallableClass(
      toString(node.name),
      node.members.map((v) => CallableMethod.fromNode(v as MethodDeclaration)),
    );
  }
}

const recurseApplyRange = (v: any, range: any) => {
  if (typeof v === 'object') {
    if (v === null) return;
    if (Array.isArray(v)) return v.forEach((v) => recurseApplyRange(v, range));
    if (v.range) v.range = range;
    Object.entries(v).forEach(([k, v]) => {
      if (k === 'range') return;
      return recurseApplyRange(v, range);
    });
  }
};

export default class CallableTransform extends TransformVisitor {
  public klass: ClassDeclaration | null;
  public publicMethods: Array<MethodDeclaration>;
  public local: string;
  constructor(...args) {
    super(...args);
    this.publicMethods = [];
    this.local = 'a';
  }
  afterParse(parser: Parser): void {
    // Create new transform
    // Loop over every source
    for (const source of parser.sources) {
      // Ignore all lib (std lib). Visit everything else.
      if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
        this.visit(source);
      }
    }
  }
  visitClassDeclaration(node: ClassDeclaration, isDefault: boolean = false): ClassDeclaration {
    this.klass = node;
    this.publicMethods = [];
    const newClass = super.visitClassDeclaration(node, isDefault);
  }
  visitMethodDeclaration(node: MethodDeclaration): MethodDeclaration {
    if (node.decorators && node.decorators.length) {
      if (((node.decorators[0]).name as IdentifierExpression).text === 'public') {
        this.publicMethods.push(CallableMethod.fromNode(cloneNode(node)));
      }
    }
    return super.visitMethodDeclaration(node);
  }
  nextLocal(): string {
    const result = this.local;
    this.local = String.fromCharCode(this.local.charCodeAt(0) + 1); 
    return result;
  }
  buildReadMethod(): string {
    return (
      `callMethod(selector: public.Selector, calldata: public.Calldata): BytesWriter {
         const reader = public.BytesReader(calldata);
	 let writer = changetype<BinaryWriter>(0);
	 switch (method) {` + "\n"
      this.publicMethods.map((v, i, ary) => {
        return `    case public.encodeSelector("${v.name}"):` + "\n" + '        writer = this.${v.name}(' + v.parameters.map((v, i) => {
              switch (v.typeName) {
                case "string":
                  return `reader.readStringWithLength()`;
                case "u256":
                  return `reader.readU256()`;
                case "u128":
                  return `reader.readU256().toU128()`;
                case "u64":
                case "u32":
                case "u16":
                case "u8":
                  return `reader.readU256()`;
                case "boolean":
                  return `reader.readBoolean()`;
                case "ArrayBuffer":
                  return `reader.readBytesWithLength().buffer`;
                case "Uint8Array":
                  return `reader.readBytesWithLength()`;
                case "Address":
                case "public.Address":
                  return `reader.readAddress()`;
                case "Address[]":
                case "public.Address[]":
                case "Array<Address>":
                case "Array<public.Address>":
                  return `reader.readAddressArray()`;
                case "u256[]":
                case "Array<u256>":
                  return `reader.readTuple()`;
              }
            }).join(", ") + ');\n      break;\n' +
            '    if (changetype<usize>(writer) === 0) return super.callMethod(selector, calldata);\n      return writer.toBinaryReader().' + (() => {
              switch (v.returnType.typeName) {
                case "string":
                  return `    writer.writeStringWithLength(${v.name});\n`;
                case "u256":
                  return `    writer.writeU256(${v.name});\n`;
                case "u128":
                  return `    write.writeU256(u256.fromU128(${v.name}));\n`;
                case "u64":
                case "u32":
                case "u16":
                case "u8":
                  return `    writer.write${v.typeName.toUpperCase()}(${v.name});\n`;
                case "boolean":
                  return `    writer.writeBoolean(${v.name});\n`;
                case "ArrayBuffer":
                  return `    writer.writeBytesWithLength(Uint8Array.wrap(${v.name}));\n`;
                case "Uint8Array":
                  return `    writer.writeBytesWithLength(${v.name});\n`;
                case "Address":
                case "callable.Address":
                  return `    writer.writeAddress(${v.name});\n`;
                case "Address[]":
                case "callable.Address[]":
                case "Array<Address>":
                case "Array<callable.Address>":
                  return `    writer.writeAddressArray(${v.name});\n`;
                case "u256[]":
                case "Array<u256>":
                  return `    writer.writeTuple(${v.name});\n`;
            .join("") +
          `    return reader;` + 
          `  }\n`
        );
      }).join('') +
      `}`;
  }
  get name(): string {
    return "public";
  }
}

