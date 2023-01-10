// eslint-disable-next-line import/no-extraneous-dependencies
import * as ts from 'typescript';
import { ISchemaAny, object } from '../index';
import BaseSchema from './BaseSchema';

const { factory: f } = ts;

export default function schemaToInterface(
  schema: ISchemaAny | Record<string, ISchemaAny> | Record<string, Record<string, ISchemaAny>>,
): ts.TypeNode {
  if (schema !== null && !(schema instanceof BaseSchema) && typeof schema === 'object') {
    const members = Object.entries(schema).map(([key, value]) => {
      const propName = getIdentifierOrStringLiteral(key);
      const type = schemaToInterface(value);
      return f.createPropertySignature(undefined, propName, undefined, type);
    });
    return f.createTypeLiteralNode(members);
  }

  switch (schema.typeName) {
    case 'string': {
      if (schema.enum) {
        const types = schema.enum.map(x => f.createLiteralTypeNode(f.createStringLiteral(x)));
        return f.createUnionTypeNode(types);
      }
      return f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    }
    case 'number':
      return f.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'bigint':
      return f.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword);
    case 'boolean':
      return f.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'date':
      return f.createTypeReferenceNode(f.createIdentifier('Date'));
    case 'buffer':
      return f.createTypeReferenceNode(f.createIdentifier('Buffer'));
    case 'object': {
      const properties = Object.entries(schema.fields) as [string, ISchemaAny][];

      const members: ts.TypeElement[] = properties.map(([key, childSchema]) => {
        const type = schemaToInterface(childSchema);
        const optional = childSchema.optional
          ? f.createToken(ts.SyntaxKind.QuestionToken)
          : undefined;
        const propName = getIdentifierOrStringLiteral(key);

        const propertySignature = f.createPropertySignature(undefined, propName, optional, type);
        const comments: string[] = [];

        if (childSchema.description) {
          comments.push(childSchema.description);
        }
        const constraints: string[] = [];
        if ('decimals' in childSchema) constraints.push(`@decimals ${childSchema.decimals}`);
        if ('integer' in childSchema && childSchema.integer) constraints.push(`@integer`);
        if ('min' in childSchema) constraints.push(`@min ${childSchema.min}`);
        if ('max' in childSchema) constraints.push(`@max ${childSchema.min}`);
        if ('encoding' in childSchema)
          constraints.push(`@encoding ${String(childSchema.encoding)}`);
        if ('format' in childSchema) constraints.push(`@format ${childSchema.format}`);
        if ('minLength' in childSchema) constraints.push(`@minLength ${childSchema.minLength}`);
        if ('maxLength' in childSchema) constraints.push(`@maxLength ${childSchema.maxLength}`);
        if ('length' in childSchema) constraints.push(`@length ${childSchema.length}`);
        if ('regexp' in childSchema) constraints.push(`@regex /${childSchema.regexp.source}/`);
        if ('future' in childSchema && childSchema.future) constraints.push(`@future`);
        if ('past' in childSchema && childSchema.past) constraints.push(`@past`);

        if (constraints.length) comments.push(...constraints);

        if (comments.length) {
          ts.addSyntheticLeadingComment(
            propertySignature,
            ts.SyntaxKind.MultiLineCommentTrivia,
            `*\n * ${comments.join('\n * ')}\n `,
            true,
          );
        }

        return propertySignature;
      });
      return f.createTypeLiteralNode(members);
    }

    case 'array': {
      const type = schemaToInterface(schema.element);
      return f.createArrayTypeNode(type);
    }

    case 'record': {
      const valueType = schemaToInterface(schema.values as ISchemaAny);

      return f.createTypeLiteralNode([
        f.createIndexSignature(
          undefined,
          [
            f.createParameterDeclaration(
              undefined,
              undefined,
              f.createIdentifier('x'),
              undefined,
              f.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
              undefined,
            ),
          ],
          valueType,
        ),
      ]);
    }
  }

  return f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
}

const identifierRE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function getIdentifierOrStringLiteral(str: string): ts.PropertyName {
  if (identifierRE.test(str)) {
    return f.createIdentifier(str);
  }

  return f.createStringLiteral(str);
}

export function printNode(node: ts.Node, printerOptions?: ts.PrinterOptions): string {
  const sourceFile = ts.createSourceFile(
    'print.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const printer = ts.createPrinter(printerOptions ?? { newLine: ts.NewLineKind.LineFeed });
  return (
    printer
      .printNode(ts.EmitHint.Unspecified, node, sourceFile)
      // change to 2 spaces
      .replace(/^(\s{4})+/gm, match => new Array(match.length / 4 + 1).join('  '))
  );
}
