import { Platform } from '@renderer/types/platform';

/**
 * Функция, которая возращает компонент и его атрибут
 * @param parameter компонент и атрибут, записанный в виде строки
 * @returns массив из трёх элементов, где первый - это компонент, второй - атрибут, а третий разделитель. Null, если строка не является параметром с атрибутом.
 */
export const getComponentAttribute = (parameter: string, platform: Platform | undefined) => {
  if (
    !platform ||
    parameter.includes('"') ||
    parameter.includes("'") ||
    !isNaN(Number(parameter))
  ) {
    return null;
  }
  let delimiter = '.';
  let splitParameter = parameter.split(delimiter);
  if (splitParameter.length != 2) {
    delimiter = platform.staticActionDelimeter;
    splitParameter = parameter.split(delimiter);
    if (splitParameter.length != 2) {
      return null;
    }
  }
  splitParameter.push(delimiter);
  return splitParameter;
};
