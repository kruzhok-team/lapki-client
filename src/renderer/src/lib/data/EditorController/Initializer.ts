import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { State, Note, Transition } from '@renderer/lib/drawable';
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
    this.initTransitions();
    this.initNotes();
    this.initPlatform();
    this.initComponents();

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
   * Демо: child-before-parent.json
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

  private initTransitions() {
    const items = this.app.model.data.elements.transitions;

    for (const id in items) {
      this.createTransitionView(id);
    }
  }

  private initNotes() {
    const items = this.app.model.data.elements.notes;

    for (const id in items) {
      this.createNoteView(id);
    }
  }

  private initComponents() {
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

  private initPlatform() {
    const platformName = this.app.model.data.elements.platform;

    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.app.controller.platform = platform;
  }

  // Тут все методы которые кончаются на View нужны для первичной инициализации проекта
  private createStateView(id: string) {
    const state = new State(this.app, id);
    this.states.setState(state.id, state);
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

  // private createInitialStateView(data: InitialState) {
  //   const target = this.states.get(data.target);
  //   if (!target) return;

  //   this.view.statesController.initInitialStateMark();
  // }
}
