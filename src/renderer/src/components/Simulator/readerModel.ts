const readerImpulseLabels: Record<string, string> = {
  impulseA: 'Импульс А',
  impulseB: 'Импульс Б',
  impulseC: 'Импульс В',
};

export const getReaderImpulseLabel = (impulse: string): string =>
  readerImpulseLabels[impulse] ?? impulse;

export const countUnicodeCharacters = (value: string): number => Array.from(value).length;

export const limitUnicodeCharacters = (value: string, limit: number): string =>
  Array.from(value).slice(0, limit).join('');
