/**
 * Кодер JSON-формата описания платформы.
 * Выполняет кодирование и декодирование с проверкой данных на корректность.
 *
 * Декодер бросает исключение, если JSON не соответствует схеме.
 */

/*
  Для регенерации этого модуля после изменений типов в Platforms:

  - перегенерировать схему: `npm run schema:platforms`
  - взять файл schema/Platforms.json, __положить в коммит__
  - зайти на сайт https://app.quicktype.io/
  - выбрать 
      Source type -> JSON Schema, и вставить содержимое туда. 
      Language -> TypeScript
      Use types instead of interfaces -> включено
      Name -> ввести «Platforms»
  - вставить содержимое файла в поле слева
  - скопировать содержимое файла **НИЖЕ ФУНКЦИИ invalidValue**
  - заменить соответствующий участок этого файла
*/

import { Platforms } from '@renderer/types/platform';

export default class PlatformsJSONCodec {
  public static toPlatforms(json: string): Platforms {
    return cast(JSON.parse(json), r('Platforms'));
  }

  public static platformsToJson(value: Platforms): string {
    return JSON.stringify(uncast(value, r('Platforms')), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : '';
  const keyText = key ? ` for key "${key}"` : '';
  throw Error(
    `Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`
  );
}

///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`;
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a);
        })
        .join(', ')}]`;
    }
  } else if (typeof typ === 'object' && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(
      cases.map((a) => {
        return l(a);
      }),
      val,
      key,
      parent
    );
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l('array'), val, key, parent);
    return val.map((el) => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue(l('Date'), val, key, parent);
    }
    return d;
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue(l(ref || 'object'), val, key, parent);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref);
      }
    });
    return result;
  }

  if (typ === 'any') return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === 'object' && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty('props')
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  PlatformFile: o(
    [
      { json: '$ref', js: '$ref', typ: '' },
      { json: '$schema', js: '$schema', typ: '' },
      { json: 'definitions', js: 'definitions', typ: r('Definitions') },
    ],
    false
  ),
  Definitions: o(
    [
      { json: 'ArgType', js: 'ArgType', typ: r('ArgType') },
      { json: 'ComponentProto', js: 'ComponentProto', typ: r('ComponentProto') },
      { json: 'MethodProto', js: 'MethodProto', typ: r('MethodProto') },
      { json: 'ParameterProto', js: 'ParameterProto', typ: r('ParameterProto') },
      { json: 'Platform', js: 'Platform', typ: r('Platform') },
      { json: 'Platforms', js: 'Platforms', typ: r('Platforms') },
      { json: 'SignalProto', js: 'SignalProto', typ: r('Proto') },
      { json: 'VariableProto', js: 'VariableProto', typ: r('Proto') },
    ],
    false
  ),
  ArgType: o([{ json: 'anyOf', js: 'anyOf', typ: a(r('AnyOf')) }], false),
  AnyOf: o(
    [
      { json: 'type', js: 'type', typ: '' },
      { json: 'items', js: 'items', typ: u(undefined, r('Description')) },
    ],
    false
  ),
  Description: o([{ json: 'type', js: 'type', typ: r('TypeEnum') }], false),
  ComponentProto: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('ComponentProtoProperties') },
      { json: 'required', js: 'required', typ: a('') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  ComponentProtoProperties: o(
    [
      { json: 'description', js: 'description', typ: r('Description') },
      { json: 'img', js: 'img', typ: r('Description') },
      { json: 'methods', js: 'methods', typ: r('Methods') },
      { json: 'name', js: 'name', typ: r('Description') },
      { json: 'parameters', js: 'parameters', typ: r('Methods') },
      { json: 'signals', js: 'signals', typ: r('Methods') },
      { json: 'singletone', js: 'singletone', typ: r('Description') },
      { json: 'variables', js: 'variables', typ: r('Methods') },
    ],
    false
  ),
  Methods: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: r('TypeClass') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  TypeClass: o([{ json: '$ref', js: '$ref', typ: '' }], false),
  MethodProto: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('MethodProtoProperties') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  MethodProtoProperties: o(
    [
      { json: 'description', js: 'description', typ: r('Description') },
      { json: 'img', js: 'img', typ: r('Description') },
      { json: 'parameters', js: 'parameters', typ: r('Methods') },
    ],
    false
  ),
  ParameterProto: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('ParameterProtoProperties') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  ParameterProtoProperties: o(
    [
      { json: 'description', js: 'description', typ: r('Description') },
      { json: 'img', js: 'img', typ: r('Description') },
      { json: 'name', js: 'name', typ: r('Description') },
      { json: 'type', js: 'type', typ: r('TypeClass') },
    ],
    false
  ),
  Platform: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('PlatformProperties') },
      { json: 'required', js: 'required', typ: a('') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  PlatformProperties: o(
    [
      { json: 'components', js: 'components', typ: r('Methods') },
      { json: 'description', js: 'description', typ: r('Description') },
      { json: 'name', js: 'name', typ: r('Description') },
    ],
    false
  ),
  Platforms: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('PlatformsProperties') },
      { json: 'required', js: 'required', typ: a('') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  PlatformsProperties: o([{ json: 'platform', js: 'platform', typ: r('Methods') }], false),
  Proto: o(
    [
      { json: 'additionalProperties', js: 'additionalProperties', typ: true },
      { json: 'properties', js: 'properties', typ: r('SignalProtoProperties') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  SignalProtoProperties: o(
    [
      { json: 'description', js: 'description', typ: r('Description') },
      { json: 'img', js: 'img', typ: r('Description') },
    ],
    false
  ),
  TypeEnum: ['boolean', 'string'],
};
