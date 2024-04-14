import { Container } from '@renderer/lib/basic';
import { loadPlatform } from '@renderer/lib/data/PlatformLoader';
import { State, Note, Transition } from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';

import { MachineController } from './MachineController';

/**
 * Класс инкапсулирующий логику инициализации {@link MachineController|контроллера машины состояний}
 * который эджектится (https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) в конструкторе. Наружу отдаёт только метод init
 */
export class Initializer {
  constructor(private container: Container, private machineController: MachineController) {}

  init() {
    this.resetEntities();

    this.initStates();
    this.initTransitions();
    this.initNotes();
    this.initPlatform();
    this.initComponents();

    this.container.viewCentering();
  }

  private get states() {
    return this.machineController.states;
  }
  private get transitions() {
    return this.machineController.transitions;
  }
  private get notes() {
    return this.machineController.notes;
  }
  private get platform() {
    return this.machineController.platform;
  }
  private get history() {
    return this.container.history;
  }

  private resetEntities() {
    this.container.children.clear();
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
    // this.container.statesController.clearInitialStateMark();
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
    const items = this.container.app.manager.data.elements.states;

    for (const id in items) {
      this.createStateView(id);
    }

    for (const id in items) {
      const data = items[id];

      if (!data.parentId) continue;

      this.linkStateView(data.parentId, id);
    }

    // const initialState = this.container.app.manager.data.elements.initialState;
    // if (initialState) this.createInitialStateView(initialState);
  }

  private initTransitions() {
    const items = this.container.app.manager.data.elements.transitions;

    for (const id in items) {
      this.createTransitionView(id);
    }
  }

  private initNotes() {
    const items = this.container.app.manager.data.elements.notes;

    for (const id in items) {
      this.createNoteView(id);
    }
  }

  private initComponents() {
    const items = this.container.app.manager.data.elements.components;

    for (const name in items) {
      const component = items[name];
      // this.components.set(name, new Component(component));
      this.platform.nameToVisual.set(name, {
        component: component.type,
        label: component.parameters['label'],
        color: component.parameters['labelColor'],
      });
    }
  }

  private initPlatform() {
    const platformName = this.container.app.manager.data.elements.platform;

    // ИНВАРИАНТ: платформа должна существовать, проверка лежит на внешнем поле
    const platform = loadPlatform(platformName);
    if (typeof platform === 'undefined') {
      throw Error("couldn't init platform " + platformName);
    }

    this.machineController.platform = platform;
  }

  // Тут все методы которые кончаются на View нужны для первичной инициализации проекта
  private createStateView(id: string) {
    const state = new State(this.container, id);
    this.states.setState(state.id, state);
    this.states.watch(state);
    this.container.children.add(state, Layer.States);
  }

  private linkStateView(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    this.container.children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  }

  private createTransitionView(id: string) {
    const transition = new Transition(this.container, id);
    this.transitions.set(id, transition);
    this.transitions.linkTransition(id);
    this.transitions.watchTransition(transition);
  }

  private createNoteView(id: string) {
    const note = new Note(this.container, id);
    this.notes.set(id, note);
    this.container.children.add(note, Layer.Notes);
    this.notes.watch(note);
  }

  // private createInitialStateView(data: InitialState) {
  //   const target = this.states.get(data.target);
  //   if (!target) return;

  //   this.container.statesController.initInitialStateMark();
  // }
}
