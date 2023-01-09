import { IAnySchemaJson, IObjectSchemaJson } from '../interfaces/ISchemaJson';

export default function jsonToSchemaCode(
  json: Record<string, IAnySchemaJson> | IAnySchemaJson,
  schemaImports: Set<string>,
): string {
  if (!json) return undefined;

  if (json.typeName) {
    return parseField(json as IAnySchemaJson, schemaImports);
  }

  let js = `{\n`;
  for (const [field, schemaJson] of Object.entries(json)) {
    js += `  ${getFieldName(field)}: ${parseField(schemaJson, schemaImports, 2)},\n`;
  }
  return `${js}}`;
}

function parseField(json: IAnySchemaJson, schemaImports: Set<string>, leadingSpaces = 0): string {
  const { typeName, element, fields, values, keys, ...config } = json as any;
  if (config.optional !== true) delete config.optional;
  schemaImports.add(typeName);

  if (typeName === 'object') {
    return parseObjectSchema(json as IObjectSchemaJson, schemaImports, leadingSpaces);
  }

  if (typeName === 'array') {
    // use shortcut by default
    if (Object.keys(config).length === 0) {
      const field = parseField(element, schemaImports, leadingSpaces);
      return `array(${field})`;
    }
    config.element = parseField(element, schemaImports, leadingSpaces + 2);
  }

  if (typeName === 'record') {
    config.values = parseField(values, schemaImports, leadingSpaces + 2);
    if (keys) config.keys = parseField(keys, schemaImports, leadingSpaces + 2);
  }

  let js = `${typeName}(`;

  const configEntries = Object.keys(config).length;
  if (configEntries > 0) {
    js += '{';
    if (configEntries > 1) js += '\n';

    for (const [key, value] of Object.entries(config)) {
      if (configEntries > 1) {
        js += spaces(leadingSpaces + 2);
      } else {
        js += ' ';
      }
      js += `${getFieldName(key)}: ${JSON.stringify(value)}`;
      if (configEntries > 1) js += ',\n';
    }
    if (configEntries === 1) js += ' ';
    else js += spaces(leadingSpaces);
    js += '}';
  }
  return `${js})`;
}

function parseObjectSchema(
  json: IObjectSchemaJson,
  schemaImports: Set<string>,
  leadingSpaces = 0,
): string {
  const { typeName, fields, ...config } = json;
  if (config.optional !== true) delete config.optional;

  schemaImports.add('object');
  let js = `object({\n`;

  const configEntries = Object.keys(config).length;
  const indented = spaces(leadingSpaces + 2);

  if (configEntries > 0) {
    js += `${indented}fields: {\n`;
  }
  for (const [field, schemaJson] of Object.entries(fields)) {
    js += `${indented}${getFieldName(field)}: ${parseField(
      schemaJson,
      schemaImports,
      leadingSpaces + 2,
    )},\n`;
  }
  if (configEntries > 0) {
    // close fields
    js += '},\n';
    for (const [key, value] of Object.entries(config)) {
      js += `${indented}${getFieldName(key)}: ${JSON.stringify(value)},\n`;
    }
  }
  js += spaces(leadingSpaces);
  return `${js}})`;
}

const identifierRE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function getFieldName(str: string): string {
  if (identifierRE.test(str)) {
    return str;
  }

  return JSON.stringify(str);
}

function spaces(count: number): string {
  let spacesStr = '';
  for (let i = 0; i < count; i += 1) spacesStr += ' ';
  return spacesStr;
}
