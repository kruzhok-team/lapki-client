import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import {
  State,
  Note,
  Transition,
  InitialState,
  FinalState,
  ChoiceState,
  GhostTransition,
} from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';

/**
 * Класс инкапсулирующий логику инициализации {@link EditorController|контроллера машины состояний}
 * который эджектится (https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) в конструкторе. Наружу отдаёт только метод init
 */
export class Initializer {
  constructor(private app: CanvasEditor) {}

  init() {
    this.resetEntities();

    this.initStates();
    this.initInitialStates();
    this.initFinalStates();
    this.initChoiceStates();
    this.initTransitions();
    this.initNotes();

    this.app.view.viewCentering();
  }

  private get states() {
    return this.app.controller.states;
  }
  private get transitions() {
    return this.app.controller.transitions;
  }
  private get notes() {
    return this.app.controller.notes;
  }
  private get platform() {
    return this.app.controller.platform;
  }
  private get history() {
    return this.app.controller.history;
  }

  private resetEntities() {
    this.app.view.children.clear();
    this.transitions.forEach((value) => {
      this.transitions.unwatchTransition(value);
    });
    this.states.forEach((value) => {
      this.states.unwatch(value);
    });
    this.notes.forEach((value) => {
      this.notes.unwatch(value);
    });

    this.states.clear();
    this.transitions.clear();
    this.notes.clear();
    this.history.clear();
  }

  /**
   * Первичная инициализация вьюшек состояний из схемы,
   * важно чтобы линковка была после создания всего,
   * а создание и линковка переходов была после вызова этого метода
   *
   * Это нужно потому что в схемы могут идти сначала дети а потом родители
   */
  private initStates() {
    const items = this.app.model.data.elements.states;

    for (const id in items) {
      this.createStateView(id);
    }

    for (const id in items) {
      const data = items[id];

      if (!data.parentId) continue;

      this.linkStateView(data.parentId, id);
    }
  }

  private initInitialStates() {
    const items = this.app.model.data.elements.initialStates;

    for (const id in items) {
      this.createInitialStateView(id);
    }

    for (const id in items) {
      const data = items[id];

      if (!data.parentId) continue;

      this.linkInitialStateView(data.parentId, id);
    }
  }

  private initFinalStates() {
    const items = this.app.model.data.elements.finalStates;

    for (const id in items) {
      this.createFinalStateView(id);
    }

    for (const id in items) {
      const data = items[id];

      if (!data.parentId) continue;

      this.linkFinalStateView(data.parentId, id);
    }
  }

  private initChoiceStates() {
    const items = this.app.model.data.elements.choiceStates;

    for (const id in items) {
      this.createChoiceStateView(id);
    }

    for (const id in items) {
      const data = items[id];

      if (!data.parentId) continue;

      this.linkChoiceStateView(data.parentId, id);
    }
  }

  private initTransitions() {
    const items = this.app.model.data.elements.transitions;

    for (const id in items) {
      this.createTransitionView(id);
    }

    // Инициализация призрачного перехода
    this.transitions.ghost = new GhostTransition(this.app);
    this.app.view.children.add(this.transitions.ghost, Layer.GhostTransition);
  }

  private initNotes() {
    const items = this.app.model.data.elements.notes;

    for (const id in items) {
      this.createNoteView(id);
    }
  }

  initComponents() {
    if (!this.platform) return;

    const items = this.app.model.data.elements.components;

    for (const name in items) {
      const component = items[name];
      this.platform.nameToVisual.set(name, {
        component: component.type,
        label: component.parameters['label'],
        color: component.parameters['labelColor'],
      });
    }
  }

  // Тут все методы которые кончаются на View нужны для первичной инициализации проекта
  private createStateView(id: string) {
    const state = new State(this.app, id);
    this.states.data.states.set(state.id, state);
    this.states.watch(state);
    this.app.view.children.add(state, Layer.States);
  }

  private linkStateView(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  }

  private createTransitionView(id: string) {
    const transition = new Transition(this.app, id);
    this.transitions.set(id, transition);
    this.transitions.linkTransition(id);
    this.transitions.watchTransition(transition);
  }

  private createNoteView(id: string) {
    const note = new Note(this.app, id);
    this.notes.set(id, note);
    this.app.view.children.add(note, Layer.Notes);
    this.notes.watch(note);
  }

  private createInitialStateView(id: string) {
    const state = new InitialState(this.app, id);
    this.states.data.initialStates.set(state.id, state);
    this.states.watch(state);
    this.app.view.children.add(state, Layer.InitialStates);
  }

  private linkInitialStateView(parentId: string, childId: string) {
    const parent = this.states.data.states.get(parentId);
    const child = this.states.data.initialStates.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.InitialStates);
    child.parent = parent;
    parent.children.add(child, Layer.InitialStates);
  }

  private createFinalStateView(id: string) {
    const state = new FinalState(this.app, id);
    this.states.data.finalStates.set(state.id, state);
    this.states.watch(state);
    this.app.view.children.add(state, Layer.FinalStates);
  }

  private linkFinalStateView(parentId: string, childId: string) {
    const parent = this.states.data.states.get(parentId);
    const child = this.states.data.finalStates.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.FinalStates);
    child.parent = parent;
    parent.children.add(child, Layer.FinalStates);
  }

  private createChoiceStateView(id: string) {
    const state = new ChoiceState(this.app, id);
    this.states.data.choiceStates.set(state.id, state);
    this.states.watch(state);
    this.app.view.children.add(state, Layer.ChoiceStates);
  }

  private linkChoiceStateView(parentId: string, childId: string) {
    const parent = this.states.data.states.get(parentId);
    const child = this.states.data.choiceStates.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.ChoiceStates);
    child.parent = parent;
    parent.children.add(child, Layer.ChoiceStates);
  }
}
