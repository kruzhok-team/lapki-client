/**
 * Стиль нод редактора машин состояний
 */
export const stateStyle = {
  width: 450,
  height: 100,
  bodyBg: '#404040',
  bodyBorderRadius: 6,

  titleFontFamily: 'Fira Sans',
  titleLineHeight: 0,
  titleFontSize: 15,
  titleBaseLine: 'hanging' as CanvasTextBaseline,
  titleColor: '#FFF',
  titleBg: '#525252',

  eventColor: '#FFF',
  eventBaseLine: 'hanging' as CanvasTextBaseline,

  selectedBorderWidth: 2,
  selectedBorderColor: '#FFF',
};

/**
 * Стиль переходов в редакторе машин состояний
 */
export const transitionStyle = {
  width: 3,
  bgColor: '#FFF',
  startSize: 5,
  padEnd: 5,
  endSize: 19,
  notSelectedAlpha: 0.7,
};
