export type PictoType = 'event' | 'action' | 'condition';

export type Picto = {
  type: PictoType;
  x: number;
  y: number;
  width: number;
  height: number;
};
