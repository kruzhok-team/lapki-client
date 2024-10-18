import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import {
  Note,
  Transition,
  InitialState,
  FinalState,
  ChoiceState,
  GhostTransition,
} from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
import {
  State as DataState,
  Transition as DataTransition,
  Note as DataNote,
  InitialState as DataInitialState,
  ChoiceState as DataChoiceState,
  FinalState as DataFinalState,
  Component,
  StateMachine,
} from '@renderer/types/diagram';

import { CanvasController } from './ModelController/CanvasController';

/**
 * Класс инкапсулирующий логику инициализации {@link EditorController|контроллера машины состояний}
 * который эджектится (https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) в конструкторе. Наружу отдаёт только метод init
 */
export class Initializer {
  constructor(private app: CanvasEditor, private controller: CanvasController) {}

  init() {
    // TODO: Вот эта штука почему-то вызывается при смене вкладок
    // this.resetEntities();

    // this.initStates();
    // this.initInitialStates();
    // this.initFinalStates();
    // this.initChoiceStates();
    // this.initTransitions();
    // this.initNotes();
    // this.initComponents('G');
    // this.initStateMachines();
    this.app.view.viewCentering();
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
    return this.controller.platform;
  }

  /**
   * Первичная инициализация вьюшек состояний из схемы,
   * важно чтобы линковка была после создания всего,
   * а создание и линковка переходов была после вызова этого метода
   *
   * Это нужно потому что в схемы могут идти сначала дети а потом родители
   */
  initStates(smId: string, states: { [id: string]: DataState }) {
    for (const id in states) {
      this.states.createState({ smId, id: id, ...states[id] });
    }

    for (const id in states) {
      const data = states[id];

      if (!data.parentId) continue;

      this.linkStateView(data.parentId, id);
    }
  }

  initInitialStates(states: { [id: string]: DataInitialState }) {
    for (const id in states) {
      const state = states[id];
      this.createInitialStateView(id, state);
    }

    for (const id in states) {
      const data = states[id];

      if (!data.parentId) continue;

      this.linkInitialStateView(data.parentId, id);
    }
  }

  initFinalStates(smId: string, finals: { [id: string]: DataFinalState }) {
    for (const id in finals) {
      const final = finals[id];
      this.createFinalStateView(smId, id, final);
    }

    for (const id in finals) {
      const data = finals[id];

      if (!data.parentId) continue;

      this.linkFinalStateView(data.parentId, id);
    }
  }

  initChoiceStates(smId: string, choices: { [id: string]: DataChoiceState }) {
    for (const id in choices) {
      const choice = choices[id];
      this.createChoiceStateView(smId, id, choice);
    }

    for (const id in choices) {
      const data = choices[id];

      if (!data.parentId) continue;

      this.linkChoiceStateView(data.parentId, id);
    }
  }

  initTransitions(smId: string, transitions: { [id: string]: DataTransition }) {
    for (const id in transitions) {
      const transition = transitions[id];
      this.createTransitionView(smId, id, transition);
    }

    // Инициализация призрачного перехода
    this.transitions.ghost = new GhostTransition(this.app);
    this.app.view.children.add(this.transitions.ghost, Layer.GhostTransition);
  }

  initNotes(notes: { [id: string]: DataNote }) {
    for (const id in notes) {
      this.createNoteView(id, notes[id]);
    }
  }

  initStateMachines(stateMachines: { [id: string]: StateMachine }) {
    for (const smId in stateMachines) {
      if (smId === '') continue;
      const dataSm = stateMachines[smId];
      this.controller.stateMachines.createStateMachine({
        smId,
        ...dataSm,
      });
      for (const componentId in dataSm.components) {
        const component = dataSm.components[componentId];
        const drawableComponent = this.controller.components.createComponent({
          smId,
          name: componentId,
          ...component,
        });

        if (!drawableComponent) continue;

        this.controller.stateMachines.addComponent(smId, drawableComponent);
      }
    }
  }

  // Флаг нужен, чтобы повторно не добавлять
  initComponents(smId: string, components: { [id: string]: Component }) {
    if (!this.platform[smId]) return;
    for (const name in components) {
      const component = components[name];
      // this.createComponentView(sm, name);
      // }
      this.platform[smId].nameToVisual.set(name, {
        component: component.type,
        label: component.parameters['label'],
        color: component.parameters['labelColor'],
      });
    }
  }

  private linkStateView(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  }

  private createTransitionView(smId: string, id: string, transitionData: DataTransition) {
    const transition = new Transition(this.app, id, smId, transitionData);
    this.transitions.set(id, transition);
    this.transitions.linkTransition(id);
    this.transitions.watchTransition(transition);
  }

  private createNoteView(id: string, noteData: DataNote) {
    const note = new Note(this.app, id, noteData);
    this.notes.set(id, note);
    this.app.view.children.add(note, Layer.Notes);
    this.notes.watch(note);
  }

  private createInitialStateView(id: string, initialStateData: DataInitialState) {
    const state = new InitialState(this.app, id, initialStateData);
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

  private createFinalStateView(smId: string, id: string, finalStateData: DataFinalState) {
    const state = new FinalState(this.app, id, smId, finalStateData);
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

  private createChoiceStateView(smId: string, id: string, choiceStateData: DataChoiceState) {
    const state = new ChoiceState(this.app, id, smId, choiceStateData);
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
