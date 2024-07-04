const canvas = document.createElement('canvas');
canvas.width = 1000;
canvas.height = 1000;
const measureCtx = canvas.getContext('2d') as CanvasRenderingContext2D;
const textMap = new Map<string, Map<string, number>>();

export const getTextWidth = (text: string, font: string): number => {
  if (textMap.has(font)) {
    const cache = textMap.get(font)!;
    const width = cache.get(text);
    if (width !== undefined) {
      return width;
    }
  } else {
    textMap.set(font, new Map());
  }

  const cache = textMap.get(font)!;

  const previousFont = measureCtx.font;

  measureCtx.font = font;

  const width = measureCtx.measureText(text).width;

  measureCtx.font = previousFont;

  cache.set(text, width);
  return width;
};

// Вспомогательная функция для prepareText для разбивки слова на строки
const splitWord = (word: string, font: string, maxWidth: number) => {
  const lines: string[][] = [];
  const newLine: string[] = [];
  let newLineWidth = 0;

  for (const char of word) {
    const charWidth = getTextWidth(char, font);

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

interface Font {
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  fontWeight?: number;
}

interface DrawTextOptions {
  x: number;
  y: number;
  font?: Font;
  textAlign?: CanvasTextAlign;
  color?: string;
}

export const prepareText = (text: string, maxWidth: number, font?: Font) => {
  const { fontSize = 16, lineHeight = 1.2, fontFamily = 'sans-serif' } = font || {};

  const textHeight = lineHeight * fontSize;
  const textArray: string[] = [];
  const initialTextArray = text.split('\n');
  const fontString = `${fontSize}px/${lineHeight} '${fontFamily}'`;

  const spaceWidth = getTextWidth(' ', fontString);

  for (const line of initialTextArray) {
    const textWidth = getTextWidth(line, fontString);

    if (textWidth <= maxWidth) {
      textArray.push(line);
      continue;
    }

    const words = line.split(' ');
    let newLine: string[] = [];
    let newLineWidth = 0;

    for (const word of words) {
      const wordWidth = getTextWidth(word, fontString);

      // Развилка когда слово больще целой строки, приходится это слово разбивать
      if (wordWidth >= maxWidth) {
        if (newLine.length > 0) {
          textArray.push(newLine.join(' '));
        }

        const splitted = splitWord(word, fontString, maxWidth);
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

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string | string[],
  options: DrawTextOptions
) => {
  const { x, y, color = '#FFF', font = {}, textAlign = 'left' } = options;
  const {
    fontSize = 16,
    lineHeight = 1.2,
    fontFamily = 'sans-serif',
    fontWeight = 400,
  } = font || {};

  const textHeight = lineHeight * fontSize;

  const prevFont = ctx.font;
  const prevFillStyle = ctx.fillStyle;
  const prevTextAlign = ctx.textAlign;
  const prevTextBaseline = ctx.textBaseline;

  ctx.font = `${fontWeight} ${fontSize}px/${lineHeight} '${fontFamily}'`;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'bottom';

  if (!Array.isArray(text)) {
    ctx.fillText(text, x, y + textHeight + textHeight * 0.05);
  } else {
    for (let i = 0; i < text.length; i++) {
      const lineY = y + i * textHeight + textHeight - textHeight * 0.05;

      ctx.fillText(text[i], x, lineY);
    }
  }

  ctx.font = prevFont;
  ctx.fillStyle = prevFillStyle;
  ctx.textAlign = prevTextAlign;
  ctx.textBaseline = prevTextBaseline;
};
