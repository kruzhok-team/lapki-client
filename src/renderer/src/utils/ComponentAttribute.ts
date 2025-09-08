import { PlatformManager } from '@renderer/lib/data/PlatformManager';
import { isVariable } from '@renderer/lib/utils';
import { Variable } from '@renderer/types/diagram';

/**
 * Функция, которая возращает компонент и его атрибут
 * @param parameter компонент и атрибут, записанный в виде строки
 * @returns массив из трёх элементов, где первый - это компонент, второй - атрибут, а третий разделитель. Null, если строка не является параметром с атрибутом.
 */
export const getComponentAttribute = (
  parameter: string | Variable | undefined,
  platform: PlatformManager | undefined
) => {
  if (parameter === undefined) return null;
  if (
    !platform ||
    (typeof parameter === 'string' &&
      (parameter.includes('"') || parameter.includes("'") || !isNaN(Number(parameter))))
  ) {
    return null;
  }
  if (isVariable(parameter)) {
    const protoComponent = platform.getComponent(parameter.component);
    return [
      parameter.component,
      parameter.method,
      protoComponent?.singletone || platform.data.staticComponents
        ? platform.data.staticActionDelimeter
        : '.',
    ];
  }
  let delimiter = '.';
  let splitParameter = parameter.split(delimiter);
  if (splitParameter.length != 2) {
    delimiter = platform.data.staticActionDelimeter;
    splitParameter = parameter.split(delimiter);
    if (splitParameter.length != 2) {
      return null;
    }
  }
  splitParameter.push(delimiter);
  return splitParameter;
};
