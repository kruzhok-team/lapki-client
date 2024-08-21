import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { ChoiceState, FinalState, State } from '@renderer/lib/drawable';
import {
  CreateChoiceStateParams,
  CreateComponentParams,
  CreateFinalStateParams,
  CreateNoteParams,
  CreateStateParams,
  DeleteComponentParams,
  DeleteDrawableParams,
  DeleteStateMachineParams,
  DeleteStateParams,
  Drawable,
  Layer,
} from '@renderer/lib/types';

import { ComponentsController } from './ComponentsController';
import { NotesController } from './NotesController';
import { StateMachineController } from './StateMachineController';
import { StatesController } from './StatesController';
import { TransitionsController } from './TransitionsController';

import { Initializer } from '../Initializer';
import { loadPlatform } from '../PlatformLoader';
import { PlatformManager } from '../PlatformManager';

export type CanvasSubscribeAttribute =
  | 'state'
  | 'component'
  | 'transition'
  | 'note'
  | 'final'
  | 'choice';

export function getSignalName(smId: string, attribute: CanvasSubscribeAttribute): string {
  return `${smId}/${attribute}`;
}

interface CanvasControllerEvents {
  initPlatform: null;
  createChoice: CreateChoiceStateParams & { canUndo: boolean };
  createState: CreateStateParams & { canUndo: boolean };
  createFinal: CreateFinalStateParams & { canUndo: boolean };
  createNote: CreateNoteParams & { canUndo: boolean };
  createComponent: CreateComponentParams & { canUndo: boolean };
  deleteChoice: DeleteDrawableParams & { canUndo: boolean };
  deleteState: DeleteDrawableParams & { canUndo: boolean };
  deleteFinal: DeleteDrawableParams & { canUndo: boolean };
  deleteNote: DeleteDrawableParams & { canUndo: boolean };
  deleteComponent: DeleteDrawableParams & { canUndo: boolean };
  // changeComponent: CreateComponentParams & { canUndo: boolean };
}

export type CanvasData = {
  platformName: string;
};

export class CanvasController extends EventEmitter<CanvasControllerEvents> {
  app: CanvasEditor;
  platform: PlatformManager | null = null;
  initializer: Initializer;
  states: StatesController;
  transitions: TransitionsController;
  notes: NotesController;
  components: ComponentsController;
  stateMachines: StateMachineController;
  canvasData: CanvasData;
  stateMachinesSub: { [id: string]: CanvasSubscribeAttribute[] } = {};
  constructor(app: CanvasEditor, canvasData: CanvasData) {
    super();
    this.app = app;
    this.initializer = new Initializer(app, this);

    this.states = new StatesController(app);
    this.transitions = new TransitionsController(app);
    this.notes = new NotesController(app);

    this.components = new ComponentsController(app);
    this.stateMachines = new StateMachineController(app);
    this.canvasData = canvasData;
  }

  get view() {
    return this.app.view;
  }

  addStateMachineId(smId: string) {
    if (this.stateMachinesSub[smId]) {
      return;
    }
    this.stateMachinesSub[smId] = [];
  }

  // Функция для любой обработки Drawable
  // Используется для обработки сигналов
  private processDrawable<T>(
    smId: string,
    attribute: CanvasSubscribeAttribute,
    callback: (args: T, canUndo: boolean) => any,
    parameters: T,
    canUndo: boolean = false
  ) {
    if (!this.stateMachinesSub[smId]) {
      return;
    }
    if (!this.stateMachinesSub[smId].includes(attribute)) {
      return;
    }
    return callback(parameters, canUndo);
  }

  private bindHelper<T extends (args: any) => any>(
    smId: string,
    attribute: CanvasSubscribeAttribute,
    callback: T
  ) {
    return this.processDrawable.bind<
      this,
      [smId: string, attribute: CanvasSubscribeAttribute, callback: T],
      Parameters<T>,
      ReturnType<T>
    >(this, smId, attribute, callback);
  }

  subscribe(smId: string, attribute: CanvasSubscribeAttribute) {
    if (!this.stateMachinesSub[smId]) {
      return;
    }
    switch (attribute) {
      case 'state':
        this.on('createState', this.bindHelper(smId, 'state', this.states.createState));
        this.on('deleteState', this.bindHelper(smId, 'state', this.states.deleteState));
        break;
      case 'final':
        this.on('createFinal', this.bindHelper(smId, 'final', this.states.createFinalState));
        this.on('deleteFinal', this.bindHelper(smId, 'final', this.states.deleteFinalState));
        break;
      case 'choice':
        this.on('createChoice', this.bindHelper(smId, 'choice', this.states.createChoiceState));
        this.on('deleteChoice', this.bindHelper(smId, 'choice', this.states.deleteChoiceState));
        break;
      case 'note':
        this.on('createNote', this.bindHelper(smId, 'note', this.notes.createNote));
        this.on('deleteNote', this.bindHelper(smId, 'note', this.notes.deleteNote));
        break;
      case 'component':
        this.on(
          'createComponent',
          this.bindHelper(smId, 'component', this.components.createComponent)
        );
        this.on(
          'deleteComponent',
          this.bindHelper(smId, 'component', this.components.deleteComponent)
        );
        break;
      default:
        throw new Error('Unknown attribute');
    }

    if (this.stateMachines[smId].includes(attribute)) {
      return;
    }
    this.stateMachinesSub[smId].push(attribute);
  }

  private initPlatform() {
    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platformName = this.canvasData.platformName;
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.platform = platform;
    //! Инициализировать компоненты нужно сразу после загрузки платформы
    // Их инициализация не создает отдельными сущности на холсте а перерабатывает данные в удобные структуры
    this.initializer.initComponents('', true);
  }

  // Отлавливание дефолтных событий для контроллера
  watch() {
    this.on('initPlatform', this.initPlatform.bind(this));
  }
}
