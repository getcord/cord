#!/usr/bin/env -S node --enable-source-maps

/**
 * This script compiles our opensource code, extracts the exported symbols from
 * the TypeScript compiler output, and generates a file in the same format as
 * TJV outputs, so that we can use them in our docs.
 *
 * In general, you want to run docs-codegen.sh, which builds and runs everything
 * necessary for the docs (both this and TJV), rather than running this script
 * directly.
 */

import 'dotenv/config.js';
import * as path from 'path';

import * as prettier from 'prettier';
import ts from 'typescript';

import {
  DocNodeKind,
  StandardTags,
  TSDocConfiguration,
  TSDocParser,
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
} from '@microsoft/tsdoc';
import type {
  DocSection,
  DocPlainText,
  DocEscapedText,
  DocCodeSpan,
  DocFencedCode,
  DocNode,
  DocNodeContainer,
  DocParagraph,
  DocBlock,
  DocErrorText,
  DocComment,
} from '@microsoft/tsdoc';
import type {
  Property,
  PropertiesList,
  AnyOf,
  Interface,
  Method,
  SingleMethod,
} from 'docs/server/ui/propertiesList/types.ts';

import { isDefined } from 'common/util/index.ts';

const TSDOC_CONFIG = new TSDocConfiguration();
TSDOC_CONFIG.addTagDefinitions([
  new TSDocTagDefinition({
    tagName: '@minLength',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@maxLength',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@format',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@minimum',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@maximum',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@minItems',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@maxItems',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: '@additionalProperties',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
]);

type Writeable<T> = { -readonly [P in keyof T]: Writeable<T[P]> };

interface Namespace {
  [key: string]: Namespace | Interface | Method;
}

function containerToMarkdown(
  container: DocNodeContainer,
  customBlocks?: readonly DocBlock[],
) {
  let content = nodesToMarkdown(container.nodes);
  if (customBlocks) {
    for (const block of customBlocks) {
      if (block.blockTag.tagNameWithUpperCase === '@MAXITEMS') {
        content += `\n\nThis field has a maximum length of ${containerToMarkdown(
          block.content,
        )}.`;
      }
    }
  }
  return content;
}

function nodesToMarkdown(nodes: readonly DocNode[]) {
  return nodesToMarkdownInternal(nodes).trim();
}

function nodesToMarkdownInternal(nodes: readonly DocNode[]) {
  let result = '';
  for (const node of nodes) {
    switch (node.kind) {
      case DocNodeKind.PlainText:
        result += (node as DocPlainText).text.replaceAll(
          '(https://docs.cord.com/',
          '(/',
        );
        break;
      case DocNodeKind.EscapedText:
        result += (node as DocEscapedText).decodedText;
        break;
      case DocNodeKind.CodeSpan:
        result += '`' + (node as DocCodeSpan).code + '`';
        break;
      case DocNodeKind.FencedCode: {
        const fencedCode = node as DocFencedCode;
        result +=
          '```' + fencedCode.language + '\n' + fencedCode.code + '\n```';
        break;
      }
      case DocNodeKind.Section:
        result += nodesToMarkdownInternal((node as DocSection).nodes);
        break;
      case DocNodeKind.SoftBreak:
        result += ' ';
        break;
      case DocNodeKind.Paragraph:
        result +=
          nodesToMarkdownInternal((node as DocParagraph).nodes) + '\n\n';
        break;
      case DocNodeKind.ErrorText: {
        const errorTextNode = node as DocErrorText;
        throw new Error(
          `The docs have a TSDoc formatting error: ${errorTextNode.errorMessage}\n\n${errorTextNode.textExcerpt}`,
        );
      }
      case DocNodeKind.BlockTag:
        // A tag like @format or @example, which we can just ignore, it's not
        // part of the text
        break;
      default:
        throw new Error(`Unknown doc node kind: ${node.kind}`);
    }
  }
  return result;
}

function extractExamples(customBlocks: readonly DocBlock[]) {
  const exampleBlocks = customBlocks.filter(
    (b) =>
      b.blockTag.tagNameWithUpperCase ===
      StandardTags.example.tagNameWithUpperCase,
  );
  const result: Record<string, string> = {};
  for (const exampleBlock of exampleBlocks) {
    let nodes = exampleBlock.content.nodes;
    let key = 'Example';
    if (nodes[0].kind === DocNodeKind.Paragraph) {
      key = containerToMarkdown(nodes[0] as DocParagraph);
      nodes = nodes.slice(1);
    }
    if (nodes[0].kind === DocNodeKind.FencedCode) {
      result[key] = (nodes[0] as DocFencedCode).code.trim();
    } else {
      result[key] = nodesToMarkdown(nodes);
    }
  }
  return result;
}

function getTsDoc(node: ts.Node) {
  const sourceText = node.getSourceFile().getFullText();
  const commentRanges = ts
    .getLeadingCommentRanges(sourceText, node.pos)
    ?.filter(({ pos }) => sourceText.substring(pos, pos + 3) === '/**');
  if (!commentRanges || commentRanges.length === 0) {
    return undefined;
  }
  if (commentRanges.length !== 1) {
    throw new Error('Node had more than one doc comment');
  }
  const commentRange = commentRanges[0];
  const parser = new TSDocParser(TSDOC_CONFIG);
  return parser.parseString(
    sourceText.substring(commentRange.pos, commentRange.end),
  ).docComment;
}

function isHidden(docs: DocComment | undefined): boolean {
  if (docs?.deprecatedBlock) {
    return true;
  }

  // If we want to add types but not document them, say because it is an
  // experimental feature, we can add `@privateRemarks hidden` to the relevant
  // TSDoc section.
  if (docs?.privateRemarks) {
    return !!containerToMarkdown(docs.privateRemarks?.content).includes(
      'hidden',
    );
  }

  return false;
}

function isBuiltInType(type: ts.Type): boolean {
  return !!type.symbol?.declarations?.some(
    (d) => d.getSourceFile().hasNoDefaultLib,
  );
}

function isForeignType(type: ts.Type): boolean {
  return !!type.symbol?.declarations?.some((d) =>
    d.getSourceFile().fileName.includes('/node_modules/'),
  );
}

function isFromBuiltInType(symbol: ts.Symbol): boolean {
  return !!symbol.declarations?.some(
    (d) => d.parent.getSourceFile().hasNoDefaultLib,
  );
}

const UTILITY_TYPES = ['Partial', 'Required', 'Readonly', 'Pick', 'Omit'];

/**
 * Returns whether the given type is a built-in utility type that doesn't supply
 * any properties itself and just modifies another type.  See
 * https://www.typescriptlang.org/docs/handbook/utility-types.html.
 */
function isUtilityType(type: ts.Type): boolean {
  return !!(
    isBuiltInType(type) &&
    type.aliasSymbol &&
    UTILITY_TYPES.includes(type.aliasSymbol.name)
  );
}

function isUnion(type: ts.Type): type is ts.UnionType {
  return !!(type.flags & ts.TypeFlags.Union);
}

function isStringLiteral(type: ts.Type): type is ts.StringLiteralType {
  return !!(type.flags & ts.TypeFlags.StringLiteral);
}

function isBooleanLiteral(type: ts.Type): boolean {
  return !!(type.flags & ts.TypeFlags.BooleanLiteral);
}

function isPrimitiveType(type: ts.Type): boolean {
  return !!(
    type.flags &
    (ts.TypeFlags.String |
      ts.TypeFlags.Number |
      ts.TypeFlags.Boolean |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined)
  );
}

function isObject(type: ts.Type): type is ts.ObjectType {
  return !!(type.flags & ts.TypeFlags.Object);
}

function isIntersection(type: ts.Type): type is ts.IntersectionType {
  return !!(type.flags & ts.TypeFlags.Intersection);
}

function isFunction(type: ts.Type): boolean {
  return type.getCallSignatures().length > 0;
}

function isArray(type: ts.Type): type is ts.TypeReference {
  return (
    isObject(type) &&
    type.getSymbol()?.getName() === 'Array' &&
    !!(type.objectFlags & ts.ObjectFlags.Reference)
  );
}

function isTuple(type: ts.Type): type is ts.TypeReference {
  return (
    isObject(type) &&
    !!(type.objectFlags & ts.ObjectFlags.Reference) &&
    !!((type as ts.TypeReference).target.objectFlags & ts.ObjectFlags.Tuple)
  );
}

function isUndefined(type: ts.Type): boolean {
  return !!(type.flags & ts.TypeFlags.Undefined);
}

function isOptional(symbol: ts.Symbol): boolean {
  return !!(symbol.flags & ts.SymbolFlags.Optional);
}

function isMethod(symbol: ts.Symbol): boolean {
  return !!(symbol.flags & ts.SymbolFlags.Method);
}

function isProperty(symbol: ts.Symbol): boolean {
  return !!(symbol.flags & ts.SymbolFlags.Property);
}

function typeForSymbol(
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): [ts.Type, DocComment | undefined] {
  if (symbol.declarations?.[0]) {
    return [
      typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.declarations[0]),
      getTsDoc(symbol.declarations[0]),
    ];
  } else {
    return [typeChecker.getTypeOfSymbol(symbol), undefined];
  }
}

function typeDetails(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  options: { removeUndefined?: boolean } = {},
): Writeable<AnyOf | Property> {
  return typeDetailsInternal(type, typeChecker, new Set(), options);
}

function typeDetailsInternal(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  seenTypes: Set<ts.Type>,
  options: { removeUndefined?: boolean } = {},
): Writeable<AnyOf | Property> {
  if (seenTypes.has(type)) {
    // If we are evaluating a type and see that type again, we don't want to
    // infinitely recurse, so just emit the type's name and quit
    return {
      type: typeChecker.typeToString(type),
    };
  }
  const originalType = type;
  try {
    seenTypes.add(originalType);
    if (options.removeUndefined) {
      if (isUnion(type)) {
        const undefinedIndex = type.types.findIndex(isUndefined);
        if (undefinedIndex > -1) {
          if (type.types.length === 2) {
            type = type.types[1 - undefinedIndex];
          } else {
            type = {
              ...type,
              types: type.types.filter((t) => !isUndefined(t)),
            } as ts.UnionType;
          }
        }
      }
    }
    // I have no idea why, but sometimes the TS compiler outputs booleans as
    // `true | false` rather than `boolean`, so replace those
    if (isUnion(type) && type.types.filter(isBooleanLiteral).length === 2) {
      if (type.types.length === 2) {
        return {
          type: 'boolean',
        };
      }
      type = {
        ...type,
        types: [
          {
            flags: ts.TypeFlags.Boolean,
          },
          ...type.types.filter((t) => !isBooleanLiteral(t)),
        ],
      } as ts.UnionType;
    }
    if (isUnion(type)) {
      if (type.types.every(isStringLiteral)) {
        // This is a string union, we express those as enums
        return {
          type: 'string',
          enum: type.types.map((t) => t.value),
        };
      }
      if (type.types.every(isPrimitiveType)) {
        // A union of simple types, just put them in the array
        return {
          type: type.types.map((t) => typeChecker.typeToString(t)),
        };
      }
      // At least one of the unioned types is more complicated, use an anyOf
      return {
        anyOf: type.types.map(
          (t) =>
            typeDetailsInternal(
              t,
              typeChecker,
              seenTypes,
            ) as Writeable<Property>,
        ),
      };
    }
    if (isArray(type)) {
      return {
        type: typeChecker.typeToString(type),
        items: typeDetailsInternal(
          typeChecker.getTypeArguments(type)[0],
          typeChecker,
          seenTypes,
        ),
      };
    }
    if (isTuple(type)) {
      return {
        type: typeChecker.typeToString(type),
      };
    }
    if (
      (isObject(type) || isIntersection(type)) &&
      !isFunction(type) &&
      (!(isBuiltInType(type) || isForeignType(type)) || isUtilityType(type)) &&
      typeChecker.getPropertiesOfType(type).length > 0
    ) {
      const result: Writeable<PropertiesList> = {
        properties: {},
        propertyOrder: [],
        required: [],
      };
      for (const prop of typeChecker.getPropertiesOfType(type)) {
        const [propType, docs] = typeForSymbol(prop, typeChecker);
        if (isHidden(docs)) {
          continue;
        }
        result.properties[prop.getName()] = {
          description: docs
            ? containerToMarkdown(docs.summarySection, docs.customBlocks)
            : undefined,
          ...typeDetailsInternal(propType, typeChecker, seenTypes, {
            removeUndefined: true,
          }),
        };
        result.propertyOrder.push(prop.getName());
        if (!isOptional(prop)) {
          result.required!.push(prop.getName());
        }
      }
      const typeToString = typeChecker.typeToString(type);
      return {
        // If typeToString starts with a brace, it doesn't have a name and it's
        // just outputting the structure, so call it 'object'
        type: typeToString.startsWith('{') ? 'object' : typeToString,
        ...result,
      };
    }
    return {
      type: typeChecker.typeToString(type),
    };
  } finally {
    seenTypes.delete(originalType);
  }
}

function extractParameters(
  declaration: ts.SignatureDeclaration,
  typeChecker: ts.TypeChecker,
): Writeable<PropertiesList> {
  const result: Writeable<PropertiesList> = {
    propertyOrder: [],
    required: [],
    properties: {},
  };
  const paramDocs = getTsDoc(declaration)?.params;
  for (const parameter of declaration.parameters) {
    const name = (parameter.name as ts.Identifier).getText();
    const optional = typeChecker.isOptionalParameter(parameter);
    const docBlock = paramDocs?.tryGetBlockByName(name);
    result.properties[name] = {
      description: docBlock ? containerToMarkdown(docBlock.content) : undefined,
      ...typeDetails(typeChecker.getTypeAtLocation(parameter), typeChecker, {
        removeUndefined: optional,
      }),
    };
    result.propertyOrder.push(name);
    if (!optional) {
      result.required?.push(name);
    }
  }
  return result;
}

function extractSingleFunctionDeclaration(
  node: ts.Symbol,
  declaration: ts.SignatureDeclaration,
  typeChecker: ts.TypeChecker,
): Writeable<SingleMethod> | undefined {
  const docs = getTsDoc(declaration);
  if (!docs) {
    return undefined;
  }
  const signature = typeChecker.getSignatureFromDeclaration(declaration)!;
  return {
    name: node.getName(),
    summary: containerToMarkdown(docs.summarySection),
    examples: extractExamples(docs.customBlocks),
    parameters: extractParameters(declaration, typeChecker),
    returns: {
      description: docs.returnsBlock
        ? containerToMarkdown(docs.returnsBlock.content)
        : undefined,
      ...typeDetails(signature.getReturnType(), typeChecker),
    },
  };
}

function extractFunction(
  symbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): Writeable<Method> | undefined {
  const declarations = (symbol.getDeclarations() ?? []).filter(
    (d): d is ts.FunctionDeclaration | ts.MethodSignature =>
      ts.isFunctionDeclaration(d) || ts.isMethodSignature(d),
  );
  if (declarations.length === 0) {
    return undefined;
  }
  if (declarations.length === 1) {
    return extractSingleFunctionDeclaration(
      symbol,
      declarations[0],
      typeChecker,
    );
  } else {
    return {
      overloaded: true,
      overloads: declarations
        .filter((d) => ts.isMethodSignature(d) || !d.body)
        .map((declaration) =>
          extractSingleFunctionDeclaration(symbol, declaration, typeChecker),
        )
        .filter(isDefined),
    };
  }
}

function extractModule(
  moduleSymbol: ts.Symbol,
  typeChecker: ts.TypeChecker,
): Namespace {
  const result: Namespace = {};
  typeChecker.getExportsOfModule(moduleSymbol).forEach((exported) => {
    switch (exported.flags) {
      case ts.SymbolFlags.Alias: {
        const aliased = typeChecker.getAliasedSymbol(exported);
        switch (aliased.flags) {
          case ts.SymbolFlags.ValueModule:
            result[exported.getName()] = extractModule(aliased, typeChecker);
            break;
          case ts.SymbolFlags.Interface:
            processInterface(aliased, typeChecker, result);
            break;
        }
        break;
      }
      case ts.SymbolFlags.Interface:
      case ts.SymbolFlags.TypeAlias: {
        processInterface(exported, typeChecker, result);
        break;
      }
      case ts.SymbolFlags.Function: {
        const method = extractFunction(exported, typeChecker);
        if (method) {
          result[exported.getName()] = method;
        }
        break;
      }
    }
  });
  return result;
}

function processInterface(
  exported: ts.Symbol,
  typeChecker: ts.TypeChecker,
  result: Namespace,
): void {
  const ifaceData: Writeable<Interface> = {
    name: exported.getName(),
    methods: { methodOrder: [], required: [], methods: {} },
    properties: {
      properties: {},
      propertyOrder: [],
      required: [],
    },
  };
  const type = typeChecker.getDeclaredTypeOfSymbol(exported);
  for (const member of typeChecker.getPropertiesOfType(type)) {
    if (isFromBuiltInType(member)) {
      continue;
    }
    if (isProperty(member)) {
      const [memberType, docs] = typeForSymbol(member, typeChecker);
      if (isHidden(docs)) {
        continue;
      }
      ifaceData.properties.properties[member.getName()] = {
        ...typeDetails(memberType, typeChecker, {
          removeUndefined: isOptional(member),
        }),
        description: docs
          ? containerToMarkdown(docs.summarySection, docs.customBlocks)
          : undefined,
      };
      ifaceData.properties.propertyOrder.push(member.getName());
      if (!isOptional(member)) {
        ifaceData.properties.required!.push(member.getName());
      }
    } else if (isMethod(member)) {
      const method = extractFunction(member, typeChecker);
      if (method) {
        ifaceData.methods.methods[member.getName()] = method;
        ifaceData.methods.methodOrder.push(member.getName());
        if (!isOptional(member)) {
          ifaceData.methods.required.push(member.getName());
        }
      }
    }
  }
  // Don't bother outputting any types that are uninteresting
  if (
    Object.keys(ifaceData.methods.methods).length > 0 ||
    Object.keys(ifaceData.properties.properties).length > 0
  ) {
    result[exported.getName()] = ifaceData;
  }
}

function packageToPath(sdkPackage: string): string {
  return path.resolve(`opensource/sdk-js/packages/${sdkPackage}/index.ts`);
}

function extractPackage(sdkPackage: string, tsProgram: ts.Program): Namespace {
  const typeChecker = tsProgram.getTypeChecker();
  const sourceFile = tsProgram.getSourceFile(packageToPath(sdkPackage))!;
  return extractModule(
    typeChecker.getSymbolAtLocation(sourceFile)!,
    typeChecker,
  );
}

const PACKAGES = [
  'types',
  'react',
  'chatbot-base',
  'chatbot-anthropic',
  'chatbot-openai',
];

const main = async () => {
  // Compile the code

  const tsCompilerHost = {
    ...ts.createCompilerHost({}),

    // make sure we don't write files
    writeFile: () => {},

    // don't give it access to any directories
    getDirectories: () => [],
  };
  const tsProgram = ts.createProgram(
    PACKAGES.map(packageToPath),
    {
      target: ts.ScriptTarget.ES2021,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      strictNullChecks: true,
    },
    tsCompilerHost,
  );

  // Extract the TSDoc for the docs

  const schemaOut = Object.fromEntries(
    PACKAGES.map((p) => [p, extractPackage(p, tsProgram)]),
  );

  console.log(
    await prettier.format(
      `
// @generated
// npm run docs-codegen
/* eslint-disable */
export default ${JSON.stringify(schemaOut)} as const;`,
      { filepath: 'out.ts', ...(await prettier.resolveConfig('out.ts')) },
    ),
  );
};

Promise.resolve(main()).catch((err) => {
  console.error(err);
  process.exit(1);
});
