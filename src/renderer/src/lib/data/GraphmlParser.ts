import { XMLParser } from 'fast-xml-parser';

import {
  State,
  Transition,
  Component,
  Action,
  Event,
  InnerElements,
  emptyElements,
} from '@renderer/types/diagram';

type Node = {
  id: string;
  data?: Array<DataNode>;
  graph?: Array<Graph>;
};

type Edge = {
  source: string;
  target: string;
  data?: Array<DataNode>;
};

type Graph = {
  node: Array<Node>;
  edge: Array<Edge>;
  edgedefault: string;
  id?: string;
};

type KeyProperties = {
  attrName?: string;
  attrType?: string;
};

type Meta = {
  format: string;
  platform: string;
  name?: string;
  author?: string;
  contact?: string;
  description?: string;
  unit?: string;
};

type DataNode = {
  key: string;
  content: string;
};

type KeyNode = {
  id: string;
  for: string;
  properties: KeyProperties;
};

// interface DataProcess {
//   elements: InnerElements;
//   meta: Meta;
//   node: DataNode;
//   parentNode?: Node;
// }

function isDataNode(node: DataNode | KeyNode) {
  return (node as DataNode).key !== undefined;
}

const dataNodeProcess = new Map<
  string,
  (elements: InnerElements, meta: Meta, node: DataNode, parentNode?: Node) => void // Вынести в отдельный интерфейс?
>([
  [
    'gFormat',
    (_elemelnts: InnerElements, meta: Meta, node: DataNode, _parentNode?: Node) => {
      console.log(node);
      if (isDataNode(node)) {
        meta.format = (node as DataNode).content;
      }
    },
  ],
  [
    'dData',
    (elements: InnerElements, meta: Meta, node: DataNode, parentNode?: Node) => {
      if (parentNode !== undefined) {
        // Если это мета-компонент, то извлекаем мета-информацию
        if (parentNode.id == '') {
          parseMeta(meta, node.content);
        }
      }
    },
  ],
]);

// Функция, которая находит формат и присваивают его к Meta
function setFormatToMeta(elements: InnerElements, xml: any, meta: Meta) {
  for (const node of xml.graphml.data) {
    const dataNode: DataNode = node;
    const func: CallableFunction | undefined = dataNodeProcess.get(dataNode.key);
    if (func) {
      func(elements, meta, node);
    }
  }
}

// Функция получается на вход строку, в которой мета-информация разделена символом /
function parseMeta(meta: Meta, unproccessedMeta: string) {
  const splitedMeta = unproccessedMeta.split('\n');

  let lastPropertyKey: string = '';

  for (const property of splitedMeta) {
    if (property.includes('/')) {
      const keyValuePair = property.split('/');
      const key = keyValuePair[0].trim();
      const value = keyValuePair[1].trim();
      meta[key] = value;
      lastPropertyKey = key;
    } else {
      if (lastPropertyKey) {
        meta[lastPropertyKey] += property;
      }
    }
  }

  console.log(meta);
}

// Обработка ачального "теневого" события
// В этой функции достается вся мета-информация
// function processInitialNode(node: Node, meta: Meta) {
//   if (node.data !== undefined) {
//     for (const data of node.data) {
//     }
//   }
// }

// Обработка нод
function processNode(
  elements: InnerElements,
  node: Node,
  meta: Meta,
  awailableDataProperties: Map<string, Map<string, KeyProperties>>
): State {
  console.log(node);
  if (node.data !== undefined) {
    for (const dataNode of node.data) {
      console.log(awailableDataProperties);
      if (awailableDataProperties.get('node')?.has(dataNode.key)) {
        const func = dataNodeProcess.get(dataNode.key);
        if (func) {
          func(elements, meta, dataNode, node);
        }
      } else {
        console.log(`Неизвестный key "${dataNode.key}" для узла node!`);
      }
    }
  }
}

function processGraph(
  elements: InnerElements,
  xml: any,
  meta: Meta,
  awailableDataProperties: Map<string, Map<string, KeyProperties>>
): Map<string, State> {
  const graph: Graph = xml.graphml.graph;
  console.log(graph);
  for (const node of graph.node) {
    processNode(elements, node, meta, awailableDataProperties);
  }

  return new Map<string, State>();
}

// Добавляет допустимые свойства у узлов
function addPropertiesFromKeyNode(
  xml: any,
  awailableDataProperties: Map<string, Map<string, KeyProperties>> // Map<Название целевой ноды, Map<id свойства, аттрибуты свойства>>
) {
  for (const node of xml.graphml.key) {
    const keyNode: KeyNode = {
      id: node.id,
      for: node.for,
      properties: {
        attrName: node['attr.name'],
        attrType: node['attr.type'],
      },
    };

    // Если у нас уже есть список свойств для целевой ноды, то добавляем в уже существующий Map,
    // иначе - создаем новый.
    if (awailableDataProperties.has(keyNode.for)) {
      const nodeProperties = awailableDataProperties.get(keyNode.for);

      // Если есть такое свойство - вывести ошибку, иначе - добавить!
      if (nodeProperties?.has(keyNode.id)) {
        console.log(`Дублирование свойства ${keyNode.id} для узла ${keyNode.for}!`);
      } else {
        nodeProperties?.set(keyNode.id, keyNode.properties);
      }
    } else {
      awailableDataProperties.set(
        keyNode.for,
        new Map<string, KeyProperties>([[keyNode.id, keyNode.properties]])
      );
    }
  }
}

export function importGraphml() {
  const parser = new XMLParser({
    textNodeName: 'content',
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (_name, _jpath, isLeafNode, isAttribute) => {
      return isLeafNode && !isAttribute;
    },
  });

  const meta: Meta = {
    format: '',
    platform: '',
  };

  const elements: InnerElements = emptyElements();

  const awailableDataProperties = new Map<string, Map<string, KeyProperties>>();
  const expression = `<?xml version="1.0" encoding="UTF-8"?>
                <graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <data key="gFormat">Cyberiada-GraphML</data>

  <key id="dName" for="node" attr.name="name" attr.type="string"/>
  <key id="dData" for="edge" attr.name="data" attr.type="string"/>
  <key id="dData" for="node" attr.name="data" attr.type="string"/>
  <key id="dInitial" for="node" attr.name="initial" attr.type="string"/>
  <key id="dGeometry" for="edge"/>
  <key id="dGeometry" for="node"/>

  <graph id="G" edgedefault="directed">
    <node id="">
      <data key="dName">BearsTowerDefence</data>
      <data key="dData">name/ Автобортник
  author/ Матросов В.М.
  contact/ matrosov@mail.ru
  description/ Пример описания схемы, 
  который может быть многострочным, потому что так удобнее
  unit/ Autoborder
      </data>
    </node>

    <node id="n0">
      <data key="dName">Бой</data>
      <data key="dData">entry/
  exit/
  </data>
      <data key="dGeometry" x="-578.005" y="438.187256"
            width="672.532166" height="802.962646" />
      <graph>
        <node id="n0::n1">
          <data key="dName">Сближение</data>
          <data key="dData">entry/
  МодульДвижения.ДвигатьсяКЦели()
  exit/
  </data>
          <data key="dGeometry" x="-525.738953" y="609.6686" 
                width="468" height="170" />    
        </node>
        <node id="n0::n2">
          <data key="dName">Атака</data>
          <data key="dData">entry/
  ОружиеЦелевое.АтаковатьЦель()
  exit/
  </data>
          <data key="dGeometry" x="-630.2711" y="206.705933" 
                width="468" height="170" />
        </node>
      </graph>
    </node>
    <node id="n3">
      <data key="dName">Скан</data>
      <data key="dData">entry/
  Сенсор.ПоискВрагаПоДистанции(мин)
  exit/
  Сенсор.ОстановкаПоиска()
  </data>
      <data key="dGeometry" x="-1582.03857" y="606.497559" 
            width="468" height="330" />      
    </node>
    <node id="init">
      <data key="dInitial"></data>
      <data key="dGeometry" x="-1482.03857" y="606.497559" 
            width="20" height="20" />      
    </node>
    
    <edge source="init" target="n3"> </edge>
    <edge source="n0" target="n3">
      <data key="dData">АнализаторЦели.ЦельУничтожена/
  </data>
    </edge>
    <edge source="n0" target="n3">
      <data key="dData">АнализаторЦели.ЦельПотеряна/
  </data>
    </edge>
    <edge source="n3" target="n0::n1">
      <data key="dData">Сенсор.ЦельПолучена/
  </data>
    </edge>
    <edge source="n0::n1" target="n0::n2">
        <data key="dData">ОружиеЦелевое.ЦельВошлаВЗонуАтаки/
  </data>
    </edge>
    <edge source="n0::n2" target="n0::n1">
        <data key="dData">ОружиеЦелевое.ЦельВышлаИзЗоныАтаки/
  </data>
    </edge>
  </graph>
</graphml>`;

  const xml = parser.parse(expression);

  setFormatToMeta(elements, xml, meta);
  addPropertiesFromKeyNode(xml, awailableDataProperties);

  switch (meta.format) {
    case 'Cyberiada-GraphML': {
      processGraph(elements, xml, meta, awailableDataProperties);
      break;
    }
    default: {
      // TODO сделать модалкой
      console.log(`ОШИБКА! НЕИЗВЕСТНЫЙ ФОРМАТ "${meta.format}"!`);
    }
  }

  console.log(xml);
}
