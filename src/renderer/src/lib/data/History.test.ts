// Сгенерированные ИИ-шкой тесты
// Здесь теститься чисто история, с ее механизмом redo/undo
// В связке с ModelController непонятно как тестировать

import { describe, expect, test, vi } from 'vitest';

import { actionFunctions, History } from './History';

function createMockHistoryController() {
  const data = {
    states: {} as Record<string, any>,
    transitions: {} as Record<string, any>,
    notes: {} as Record<string, any>,
  };

  const controller = {
    createState: vi.fn((args: any) => {
      data.states[args.id] = {
        ...args,
        parentId: args.parentId,
      };
      return args.id;
    }),
    deleteState: vi.fn((args: any) => {
      delete data.states[args.id];
    }),
    linkState: vi.fn((args: any) => {
      if (data.states[args.childId]) {
        data.states[args.childId].parentId = args.parentId;
      }
    }),
    unlinkState: vi.fn((args: any) => {
      if (data.states[args.id]) {
        delete data.states[args.id].parentId;
      }
    }),
    createTransition: vi.fn((args: any) => {
      data.transitions[args.id] = {
        sourceId: args.sourceId,
        targetId: args.targetId,
      };
    }),
    deleteTransition: vi.fn((args: any) => {
      delete data.transitions[args.id];
    }),
    createNote: vi.fn((args: any) => {
      data.notes[args.id] = { text: args.text ?? '' };
    }),
    deleteNote: vi.fn((args: any) => {
      delete data.notes[args.id];
    }),
    changeNoteText: vi.fn((args: any) => {
      if (data.notes[args.id]) {
        data.notes[args.id].text = args.text;
      }
    }),
  };

  return {
    controller,
    getSnapshot: () => ({ ...data }),
  };
}

function applyHistoryAction(
  history: History,
  controller: any,
  type: keyof typeof actionFunctions,
  args: any
) {
  const executor = actionFunctions[type](controller, args);
  executor.redo();
  history.do({ type, args } as any);
}

describe('History action functions', () => {
  test('unlinkState undo restores state with canBeInitial true', () => {
    const { controller } = createMockHistoryController();
    const modelController = controller as any;

    const action = actionFunctions.unlinkState(modelController, {
      smId: 'SM',
      parentId: 'PARENT',
      params: { smId: 'SM', id: 'CHILD', canUndo: false },
      dragEndPos: { x: 10, y: 20 },
    });

    action.undo();

    expect(controller.linkState).toHaveBeenCalledTimes(1);
    expect(controller.linkState).toHaveBeenCalledWith(
      {
        smId: 'SM',
        parentId: 'PARENT',
        childId: 'CHILD',
        canBeInitial: true,
        dragEndPos: { x: 10, y: 20 },
      },
      false,
      true
    );
  });

  test('deleteState undo restores the state and allows initial state to be recreated after undo', () => {
    // Регрессионный кейс: если удалить родительское состояние, которое было
    // связано с начальным псевдосостоянием, то после Ctrl+Z состояние должно
    // вернуться вместе с возможностью заново создать начальный переход.
    // Раньше undo восстанавливал состояние с canBeInitial=false, поэтому
    // после отката начальное псевдосостояние не появлялось.
    const { controller } = createMockHistoryController();
    const modelController = controller as any;

    const action = actionFunctions.deleteState(modelController, {
      smId: 'SM',
      id: 'STATE',
      stateData: {
        name: 'State',
        parentId: undefined,
        dimensions: { width: 100, height: 100 },
        position: { x: 10, y: 20 },
        events: [],
        color: '#fff',
      },
    });

    action.undo();

    expect(controller.createState).toHaveBeenCalledTimes(1);
    expect(controller.createState).toHaveBeenCalledWith(
      {
        smId: 'SM',
        name: 'State',
        id: 'STATE',
        dimensions: { width: 100, height: 100 },
        position: { x: 10, y: 20 },
        parentId: undefined,
        events: [],
        color: '#fff',
        linkByPoint: false,
        canBeInitial: true,
      },
      false
    );
  });

  test('history undo/redo cycle preserves a nested schema with transitions and notes', () => {
    const { controller, getSnapshot } = createMockHistoryController();
    const history = new History(controller as any);

    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'root',
      name: 'Root',
      parentId: undefined,
      dimensions: { width: 120, height: 80 },
      position: { x: 0, y: 0 },
      events: [],
      color: '#ffffff',
      newStateId: 'root',
    } as any);
    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'child',
      name: 'Child',
      parentId: 'root',
      dimensions: { width: 90, height: 70 },
      position: { x: 40, y: 40 },
      events: [],
      color: '#f5f5f5',
      newStateId: 'child',
    } as any);
    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'grandchild',
      name: 'Grandchild',
      parentId: 'child',
      dimensions: { width: 90, height: 70 },
      position: { x: 20, y: 20 },
      events: [],
      color: '#eeeeee',
      newStateId: 'grandchild',
    } as any);
    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'sibling',
      name: 'Sibling',
      parentId: 'root',
      dimensions: { width: 80, height: 60 },
      position: { x: 200, y: 0 },
      events: [],
      color: '#fafafa',
      newStateId: 'sibling',
    } as any);
    applyHistoryAction(history, controller, 'unlinkState', {
      smId: 'SM',
      parentId: 'root',
      params: { smId: 'SM', id: 'child', canUndo: false },
      dragEndPos: { x: 50, y: 50 },
    } as any);
    applyHistoryAction(history, controller, 'linkState', {
      smId: 'SM',
      parentId: 'sibling',
      childId: 'child',
      dragEndPos: { x: 70, y: 40 },
    } as any);

    const afterComplexSchema = getSnapshot();

    history.undo();
    history.redo();
    history.undo();
    history.redo();

    expect(getSnapshot()).toStrictEqual(afterComplexSchema);
  });

  test('history undo/redo cycle preserves a schema after deleting and restoring a nested state', () => {
    const { controller, getSnapshot } = createMockHistoryController();
    const history = new History(controller as any);

    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'parent',
      name: 'Parent',
      parentId: undefined,
      dimensions: { width: 120, height: 80 },
      position: { x: 0, y: 0 },
      events: [],
      color: '#ffffff',
      newStateId: 'parent',
    } as any);
    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'child',
      name: 'Child',
      parentId: 'parent',
      dimensions: { width: 90, height: 70 },
      position: { x: 40, y: 40 },
      events: [],
      color: '#f5f5f5',
      newStateId: 'child',
    } as any);
    applyHistoryAction(history, controller, 'createState', {
      smId: 'SM',
      id: 'grandchild',
      name: 'Grandchild',
      parentId: 'child',
      dimensions: { width: 80, height: 60 },
      position: { x: 20, y: 20 },
      events: [],
      color: '#eeeeee',
      newStateId: 'grandchild',
    } as any);
    applyHistoryAction(history, controller, 'deleteState', {
      smId: 'SM',
      id: 'child',
      stateData: { name: 'Child', parentId: 'parent' },
    } as any);

    const afterDeletion = getSnapshot();

    history.undo();
    history.redo();
    history.undo();
    history.redo();

    expect(getSnapshot()).toStrictEqual(afterDeletion);
  });
});
