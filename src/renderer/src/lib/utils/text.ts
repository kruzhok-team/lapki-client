export const getTextHeight = (
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
): number => {
  const previousTextBaseline = ctx.textBaseline;
  const previousFont = ctx.font;

  ctx.textBaseline = 'bottom';
  ctx.font = font;
  const { actualBoundingBoxAscent: height } = ctx.measureText(text);

  ctx.textBaseline = previousTextBaseline;
  ctx.font = previousFont;

  return Math.ceil(height);
};

const textMap = new Map<string, Map<string, number>>();
export const getTextWidth = (ctx: CanvasRenderingContext2D, text: string, font: string): number => {
  if (textMap.has(font)) {
    const cache = textMap.get(font)!;
    const width = cache.get(text);
    if (width !== undefined) {
      return width;
    }
  }

  textMap.set(font, new Map());
  const cache = textMap.get(font)!;

  const previousTextBaseline = ctx.textBaseline;
  const previousFont = ctx.font;

  ctx.textBaseline = 'bottom';
  ctx.font = font;

  const width = ctx.measureText(text).width;

  ctx.textBaseline = previousTextBaseline;
  ctx.font = previousFont;

  cache.set(text, width);
  return width;
};

export const prepareText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
) => {
  const textHeight = getTextHeight(ctx, 'M', font);
  const textArray: string[] = [];
  const initialTextArray = text.split('\n');

  const spaceWidth = getTextWidth(ctx, ' ', font);

  for (const line of initialTextArray) {
    const textWidth = getTextWidth(ctx, line, font);

    if (textWidth <= maxWidth) {
      textArray.push(line);
      continue;
    }

    const words = line.split(' ');
    const newLine: string[] = [];

    for (const word of words) {
      const currentLineWidth =
        newLine.reduce((acc, cur) => acc + getTextWidth(ctx, cur, font), 0) +
        (newLine.length - 1) * spaceWidth;

      if (currentLineWidth + spaceWidth + getTextWidth(ctx, word, font) >= maxWidth) {
        textArray.push(newLine.join(' '));
        newLine.length = 0;
      }

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

  const textHeight = getTextHeight(ctx, 'M', font);

  const prevFont = ctx.font;
  const prevFillStyle = ctx.fillStyle;
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
  ctx.textAlign = prevTextAlign;
  ctx.textBaseline = prevTextBaseline;
};
