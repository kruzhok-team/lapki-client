const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 1000;
const measureCtx = canvas.getContext('2d') as CanvasRenderingContext2D;

const measureTextCache = new Map<string, Map<string, { width: number; height: number }>>();
export const measureText = (text: string, font: string) => {
  if (measureTextCache.has(font)) {
    const measurements = measureTextCache.get(font)?.get(text);
    if (measurements) return measurements;
  }

  measureTextCache.set(font, new Map());
  const cache = measureTextCache.get(font)!;

  const previousTextBaseline = measureCtx.textBaseline;
  const previousFont = measureCtx.font;

  measureCtx.textBaseline = 'bottom';
  measureCtx.font = font;
  const { actualBoundingBoxAscent: height, width } = measureCtx.measureText(text);

  measureCtx.textBaseline = previousTextBaseline;
  measureCtx.font = previousFont;

  const measurements = { width, height: Math.ceil(height) };

  cache.set(text, measurements);

  return measurements;
};

// Вспомогательная функция для prepareText для разбивки слова на строки
const splitWord = (word: string, font: string, maxWidth: number) => {
  const lines: string[][] = [];
  const newLine: string[] = [];
  let newLineWidth = 0;

  for (const char of word) {
    const charWidth = measureText(char, font).width;

    if (Math.floor(newLineWidth + charWidth) <= maxWidth) {
      newLineWidth += charWidth;
      newLine.push(char);
      continue;
    }

    lines.push([newLine.join('')]);
    newLine.length = 0;

    newLineWidth = charWidth;
    newLine.push(char);
  }

  return {
    lines,
    newLine: [newLine.join('')],
    newLineWidth,
  };
};

export const prepareText = (text: string, font: string, maxWidth: number) => {
  const textHeight = measureText('M', font).height;
  const textArray: string[] = [];
  const initialTextArray = text.split('\n');

  const spaceWidth = measureText(' ', font).width;

  for (const line of initialTextArray) {
    const textWidth = measureText(line, font).width;

    if (textWidth <= maxWidth) {
      textArray.push(line);
      continue;
    }

    const words = line.split(' ');
    let newLine: string[] = [];
    let newLineWidth = 0;

    for (const word of words) {
      const wordWidth = measureText(word, font).width;

      // Развилка когда слово больще целой строки, приходится это слово разбивать
      if (wordWidth >= maxWidth) {
        textArray.push(newLine.join(' '));

        const splitted = splitWord(word, font, maxWidth);
        textArray.push(...splitted.lines.map((line) => line.join(' ')));
        newLine = splitted.newLine;
        newLineWidth = splitted.newLineWidth;
        continue;
      }

      if (Math.floor(newLineWidth + spaceWidth + wordWidth) <= maxWidth) {
        newLineWidth += spaceWidth + wordWidth;
        newLine.push(word);
        continue;
      }

      textArray.push(newLine.join(' '));
      newLine.length = 0;

      newLineWidth = wordWidth;
      newLine.push(word);
    }

    if (newLine.length > 0) {
      textArray.push(newLine.join(' '));
    }
  }

  return { height: textArray.length * textHeight, textArray };
};

interface DrawTextOptions {
  x: number;
  y: number;
  textBaseline?: CanvasTextBaseline;
  textAlign?: CanvasTextAlign;
  font?: string;
  color?: string;
}

// TODO Весь текст через эту функцию
export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string | string[],
  options: DrawTextOptions
) => {
  const {
    x,
    y,
    color = '#FFF',
    font = ctx.font,
    textAlign = 'left',
    textBaseline = 'top',
  } = options;

  const textHeight = measureText('M', font).height;

  const prevFont = ctx.font;
  const prevFillStyle = ctx.fillStyle;
  const prevStrokeStyle = ctx.strokeStyle;
  const prevTextAlign = ctx.textAlign;
  const prevTextBaseline = ctx.textBaseline;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  if (!Array.isArray(text)) {
    ctx.fillText(text, x, y + textHeight * 0.05);
  } else {
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, y + i * textHeight + textHeight * 0.05);
    }
  }

  ctx.font = prevFont;
  ctx.fillStyle = prevFillStyle;
  ctx.strokeStyle = prevStrokeStyle;
  ctx.textAlign = prevTextAlign;
  ctx.textBaseline = prevTextBaseline;
};
