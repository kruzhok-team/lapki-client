/**
 * Кодер JSON-формата схемы.
 * Выполняет кодирование и декодирование с проверкой данных на корректность.
 *
 * Декодер бросает исключение, если JSON не соответствует схеме.
 */

/*
Для регенерации этого модуля после изменений типов в Elements:

- перегенерировать схему и кодер: `npm run type:elements`
- скопировать typeMap из temp.ts и заменить определение в этом файле (см. ЛИНИЯ ОБРЫВА).
- __положить в коммит__ schema/Elements.json, 
- удалить qt-temp.ts: `npm run quicktype:clean`
*/
// TODO: унифицировать обвязку, чтобы копировать только typeMap
//       https://blog.quicktype.io/customizing-quicktype/

import { Elements } from '@renderer/types/diagram';

export default class ElementsJSONCodec {
  public static toElements(json: string): Elements {
    return cast(JSON.parse(json), r('Elements'));
  }

  public static elementsToJson(value: Elements): string {
    return JSON.stringify(uncast(value, r('Elements')), null, 2);
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
  Elements: o(
    [
      {
        json: 'compilerSettings',
        js: 'compilerSettings',
        typ: u(undefined, u(r('CompilerSettings'), null)),
      },
      { json: 'components', js: 'components', typ: m(r('Component')) },
      { json: 'initialState', js: 'initialState', typ: r('InitialState') },
      { json: 'parameters', js: 'parameters', typ: u(undefined, m('')) },
      { json: 'platform', js: 'platform', typ: '' },
      { json: 'states', js: 'states', typ: m(r('State')) },
      { json: 'transitions', js: 'transitions', typ: a(r('Transition')) },
    ],
    false
  ),
  CompilerSettings: o(
    [
      { json: 'compiler', js: 'compiler', typ: '' },
      { json: 'filename', js: 'filename', typ: '' },
      { json: 'flags', js: 'flags', typ: a('') },
    ],
    false
  ),
  Component: o(
    [
      { json: 'parameters', js: 'parameters', typ: m('') },
      { json: 'type', js: 'type', typ: '' },
    ],
    false
  ),
  InitialState: o(
    [
      { json: 'position', js: 'position', typ: r('Point') },
      { json: 'target', js: 'target', typ: '' },
    ],
    false
  ),
  Point: o(
    [
      { json: 'x', js: 'x', typ: 3.14 },
      { json: 'y', js: 'y', typ: 3.14 },
    ],
    false
  ),
  State: o(
    [
      { json: 'bounds', js: 'bounds', typ: r('Rectangle') },
      { json: 'events', js: 'events', typ: a(r('EventData')) },
      { json: 'name', js: 'name', typ: '' },
      { json: 'parent', js: 'parent', typ: u(undefined, '') },
    ],
    false
  ),
  Rectangle: o(
    [
      { json: 'height', js: 'height', typ: 3.14 },
      { json: 'width', js: 'width', typ: 3.14 },
      { json: 'x', js: 'x', typ: 3.14 },
      { json: 'y', js: 'y', typ: 3.14 },
    ],
    false
  ),
  EventData: o(
    [
      { json: 'do', js: 'do', typ: a(r('Action')) },
      { json: 'trigger', js: 'trigger', typ: r('Event') },
    ],
    false
  ),
  Action: o(
    [
      { json: 'args', js: 'args', typ: u(undefined, m('')) },
      { json: 'component', js: 'component', typ: '' },
      { json: 'method', js: 'method', typ: '' },
    ],
    false
  ),
  Event: o(
    [
      { json: 'args', js: 'args', typ: u(undefined, m('')) },
      { json: 'component', js: 'component', typ: '' },
      { json: 'method', js: 'method', typ: '' },
    ],
    false
  ),
  Transition: o(
    [
      { json: 'color', js: 'color', typ: '' },
      { json: 'condition', js: 'condition', typ: u(undefined, u(r('Condition'), null)) },
      { json: 'do', js: 'do', typ: u(undefined, a(r('Action'))) },
      { json: 'position', js: 'position', typ: r('Point') },
      { json: 'source', js: 'source', typ: '' },
      { json: 'target', js: 'target', typ: '' },
      { json: 'trigger', js: 'trigger', typ: r('Event') },
    ],
    false
  ),
  Condition: o(
    [
      { json: 'type', js: 'type', typ: '' },
      { json: 'value', js: 'value', typ: u(a(r('Condition')), r('Variable'), 3.14, '') },
    ],
    false
  ),
  Variable: o(
    [
      { json: 'args', js: 'args', typ: u(undefined, m('')) },
      { json: 'component', js: 'component', typ: '' },
      { json: 'method', js: 'method', typ: '' },
    ],
    false
  ),
};
