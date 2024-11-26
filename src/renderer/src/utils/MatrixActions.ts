import { Dimensions } from '@renderer/lib/types';
import { Matrix } from '@renderer/types/MatrixWidget';

export const getMatrixDimensions = (matrixType: string): Dimensions => {
  const rowSize = matrixType.split('Matrix')[1];
  const [width, height] = rowSize.split('x').map((value) => Number(value));

  return {
    width,
    height,
  };
};

export const createEmptyMatrix = (matrixType: string): Matrix => {
  const { width, height } = getMatrixDimensions(matrixType);
  const emptyMatrixValue: number[][] = [];
  for (let row = 0; row != height; row += 1) {
    emptyMatrixValue.push([]);
    for (let col = 0; col != width; col += 1) {
      emptyMatrixValue[row].push(0);
    }
  }

  return {
    values: emptyMatrixValue,
    width,
    height,
  };
};

export const buildMatrix = (matrix: Matrix) => {
  let strMatrix = '{';
  for (let row = 0; row != matrix.height; row += 1) {
    for (let col = 0; col != matrix.width; col += 1) {
      strMatrix += Number(matrix.values[row][col]).toString() + ', ';
    }
  }
  strMatrix = strMatrix.slice(0, strMatrix.length - 2) + '}';

  return strMatrix;
};

export const parseMatrixFromString = (
  values: string,
  width: number,
  height: number
): number[][] => {
  const matrixValues: number[][] = [];
  const parsedValues = values
    .slice(1, values.length - 1)
    .split(',')
    .map((str) => str.trim());
  for (let row = 0; row != height; row += 1) {
    matrixValues.push(
      parsedValues.slice(row * width, (row + 1) * width).map((value) => Number(value))
    );
  }

  if (matrixValues.length !== height || !matrixValues.every((value) => value.length === width))
    throw new Error(
      `Ошибка парсинга матрицы (${values}) - количество значений не соответствует заявленному типу (Matrix${width}x${height})!`
    );
  return matrixValues;
};
