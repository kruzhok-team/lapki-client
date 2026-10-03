/*
  Порядок экспортов важен: Shape и Children должны идти первыми.

  Почему: Note и Transition импортируют базовый класс Shape через этот же
  index (`import { Shape } from '@renderer/lib/drawable'`) и сразу наследуются от него
  (`class Note extends Shape`). При этом Shape.ts сам импортирует этот index (ради Children),
  то есть импорт циклический.

  Если Note стоит выше Shape, то в момент выполнения `class Note extends Shape` модуль
  Shape ещё не выполнен и Shape === undefined -> TypeError "Class extends value undefined".
  В собранном приложении (Rollup) это не проявляется, а в vitest (vite-node) - падает.
*/
export * from './Shape';
export * from './Children';
export * from './StateNode';
export * from './Events';
export * from './GhostTransition';
export * from './Note';
export * from './Picto';
export * from './ComponentNode';
export * from './TransitionNode';
