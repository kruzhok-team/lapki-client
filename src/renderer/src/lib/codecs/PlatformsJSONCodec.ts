/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
/**
 * Кодер JSON-формата описания платформы.
 * Выполняет кодирование и декодирование с проверкой данных на корректность.
 *
 * Декодер бросает исключение, если JSON не соответствует схеме.
 */

/*
  Для регенерации этого модуля после изменений типов в Platforms:

- перегенерировать схему и кодер: `npm run type:platforms`
- скопировать typeMap из temp.ts и заменить определение в этом файле (см. ЛИНИЯ ОБРЫВА).
- __положить в коммит__ schema/Platforms.json, 
- удалить qt-temp.ts: `npm run quicktype:clean`
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

///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///// ЛИНИЯ ОБРЫВА ///

const typeMap: any = {
  Platforms: o(
    [
      { json: 'author', js: 'author', typ: '' },
      { json: 'compile', js: 'compile', typ: true },
      {
        json: 'compilingSettings',
        js: 'compilingSettings',
        typ: u(undefined, a(r('CompilingSettings'))),
      },
      { json: 'components', js: 'components', typ: m(r('ComponentProto')) },
      { json: 'defaultBuildFiles', js: 'defaultBuildFiles', typ: u(undefined, a('')) },
      { json: 'defaultIncludeFiles', js: 'defaultIncludeFiles', typ: u(undefined, a('')) },
      { json: 'delimeter', js: 'delimeter', typ: '' },
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'formatVersion', js: 'formatVersion', typ: '' },
      { json: 'hidden', js: 'hidden', typ: u(undefined, true) },
      { json: 'icon', js: 'icon', typ: '' },
      { json: 'id', js: 'id', typ: '' },
      { json: 'language', js: 'language', typ: u(undefined, '') },
      { json: 'mainFileExtension', js: 'mainFileExtension', typ: u(undefined, '') },
      { json: 'mainFunction', js: 'mainFunction', typ: u(undefined, true) },
      { json: 'name', js: 'name', typ: u(undefined, '') },
      { json: 'parameters', js: 'parameters', typ: u(undefined, m(r('ParameterProto'))) },
      { json: 'standardVersion', js: 'standardVersion', typ: '' },
      { json: 'staticComponents', js: 'staticComponents', typ: true },
      { json: 'version', js: 'version', typ: '' },
      { json: 'visual', js: 'visual', typ: true },
    ],
    false
  ),
  CompilingSettings: o(
    [
      { json: 'command', js: 'command', typ: '' },
      { json: 'flags', js: 'flags', typ: a('') },
    ],
    false
  ),
  ComponentProto: o(
    [
      { json: 'buildFiles', js: 'buildFiles', typ: u(undefined, a('')) },
      {
        json: 'constructorParameters',
        js: 'constructorParameters',
        typ: u(undefined, m(r('ParameterProto'))),
      },
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'importFiles', js: 'importFiles', typ: u(undefined, a('')) },
      { json: 'initializationFunction', js: 'initializationFunction', typ: u(undefined, '') },
      {
        json: 'initializationParameters',
        js: 'initializationParameters',
        typ: u(undefined, m(r('ParameterProto'))),
      },
      { json: 'loopActions', js: 'loopActions', typ: u(undefined, a('')) },
      { json: 'methods', js: 'methods', typ: m(r('MethodProto')) },
      { json: 'name', js: 'name', typ: u(undefined, '') },
      { json: 'signals', js: 'signals', typ: m(r('SignalProto')) },
      { json: 'singletone', js: 'singletone', typ: u(undefined, true) },
      { json: 'variables', js: 'variables', typ: m(r('VariableProto')) },
    ],
    false
  ),
  ParameterProto: o(
    [
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'name', js: 'name', typ: u(undefined, '') },
      { json: 'optional', js: 'optional', typ: u(undefined, true) },
      { json: 'type', js: 'type', typ: u(undefined, u(a(''), '')) },
    ],
    false
  ),
  MethodProto: o(
    [
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'parameters', js: 'parameters', typ: u(undefined, a(r('ArgumentProto'))) },
    ],
    false
  ),
  ArgumentProto: o(
    [
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'name', js: 'name', typ: '' },
      { json: 'type', js: 'type', typ: u(undefined, u(a(''), '')) },
    ],
    false
  ),
  SignalProto: o(
    [
      { json: 'checkMethod', js: 'checkMethod', typ: u(undefined, '') },
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'parameters', js: 'parameters', typ: u(undefined, a(r('ArgumentProto'))) },
    ],
    false
  ),
  VariableProto: o(
    [
      { json: 'description', js: 'description', typ: u(undefined, '') },
      { json: 'img', js: 'img', typ: u(undefined, '') },
      { json: 'type', js: 'type', typ: u(undefined, u(a(''), '')) },
    ],
    false
  ),
};
