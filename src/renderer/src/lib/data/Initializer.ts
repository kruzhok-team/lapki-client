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
import {
  State as DataState,
  Transition as DataTransition,
  Note as DataNote,
  InitialState as DataInitialState,
  ChoiceState as DataChoiceState,
  FinalState as DataFinalState,
  Component,
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
  private get components() {
    return this.app.controller.components;
  }
  private get platform() {
    return this.controller.platform;
  }

  private resetEntities() {
    // this.controller.stateMachines.deleteStateMachine(
    //   {
    //     id: 'G',
    //   },
    //   false
    // );
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

    this.components.forEach((value) => {
      this.components.unwatch(value);
    });

    this.components.clear();
  }

  /**
   * Первичная инициализация вьюшек состояний из схемы,
   * важно чтобы линковка была после создания всего,
   * а создание и линковка переходов была после вызова этого метода
   *
   * Это нужно потому что в схемы могут идти сначала дети а потом родители
   */
  initStates(states: { [id: string]: DataState }) {
    for (const id in states) {
      this.createStateView(id, states[id]);
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

  initFinalStates(finals: { [id: string]: DataFinalState }) {
    for (const id in finals) {
      const final = finals[id];
      this.createFinalStateView(id, final);
    }

    for (const id in finals) {
      const data = finals[id];

      if (!data.parentId) continue;

      this.linkFinalStateView(data.parentId, id);
    }
  }

  initChoiceStates(choices: { [id: string]: DataChoiceState }) {
    for (const id in choices) {
      const choice = choices[id];
      this.createChoiceStateView(id, choice);
    }

    for (const id in choices) {
      const data = choices[id];

      if (!data.parentId) continue;

      this.linkChoiceStateView(data.parentId, id);
    }
  }

  initTransitions(transitions: { [id: string]: DataTransition }) {
    for (const id in transitions) {
      const transition = transitions[id];
      this.createTransitionView(id, transition);
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

  // private initStateMachines() {
  //   this.controller.stateMachines.createStateMachine({
  //     id: 'G',
  //     components: [],
  //     position: {
  //       x: 0,
  //       y: 0,
  //     },
  //   });
  //   // this.initComponents('G');
  //   const sm = this.controller.stateMachines.getStateMachineById('G');
  //   if (sm) {
  //     sm.dimensions = {
  //       width: sm.computedDimensions.width,
  //       height: sm.computedDimensions.height,
  //     };
  //   }
  // }

  // Флаг нужен, чтобы повторно не добавлять
  initComponents(components: { [id: string]: Component }) {
    if (!this.platform) return;
    for (const name in components) {
      const component = components[name];
      // this.createComponentView(sm, name);
      // }
      this.platform.nameToVisual.set(name, {
        component: component.type,
        label: component.parameters['label'],
        color: component.parameters['labelColor'],
      });
    }
  }

  // private createComponentView(sm: string, id: string) {
  //   const icon = this.controller.platform?.getComponentIcon(id, true);
  //   if (!icon) {
  //     return;
  //   }
  //   const modelComponent = this.controller.model.data.elements.components[id];
  //   const markedIcon: MarkedIconData = {
  //     icon: icon,
  //     label: modelComponent.parameters['label'],
  //     color: modelComponent.parameters['labelColor'],
  //   };
  //   const smDrawable = this.controller.stateMachines.getStateMachineById(sm);
  //   const component = new DrawableComponent(
  //     this.appScheme,
  //     id,
  //     modelComponent.position,
  //     markedIcon,
  //     smDrawable
  //   );
  //   if (!smDrawable) {
  //     return;
  //   }
  //   this.components.set(id, component);
  //   this.components.watch(component);
  //   if (smDrawable.children) {
  //     smDrawable.children.add(component, Layer.Components);
  //   }
  // }

  // Тут все методы которые кончаются на View нужны для первичной инициализации проекта
  private createStateView(id: string, dataState: DataState) {
    const state = new State(this.app, id, dataState);
    this.states.data.states.set(state.id, state);
    this.states.watch(state);
    this.app.view.children.add(state, Layer.States);
  }

  // watch() {
  //   this.watchStates();
  //   this.watchNotes();
  //   this.watchTransitions();
  // }

  // private watchTransitions() {
  //   for (const transition of this.transitions.items.values()) {
  //     this.transitions.watchTransition(transition);
  //   }
  // }

  // private watchNotes() {
  //   for (const note of this.notes.items.values()) {
  //     this.notes.watch(note);
  //   }
  // }

  // private watchStates() {
  //   for (const stateId in this.states.data.states) {
  //     const state = this.states.data.states.get(stateId);
  //     if (!state) continue;
  //     this.states.watch(state);
  //   }
  //   for (const stateId in this.states.data.finalStates) {
  //     const state = this.states.data.finalStates.get(stateId);
  //     if (!state) continue;
  //     this.states.watch(state);
  //   }
  //   for (const stateId in this.states.data.choiceStates) {
  //     const state = this.states.data.choiceStates.get(stateId);
  //     if (!state) continue;
  //     this.states.watch(state);
  //   }
  //   for (const stateId in this.states.data.initialStates) {
  //     const state = this.states.data.initialStates.get(stateId);
  //     if (!state) continue;
  //     this.states.watch(state);
  //   }
  // }

  private linkStateView(parentId: string, childId: string) {
    const parent = this.states.get(parentId);
    const child = this.states.get(childId);

    if (!parent || !child) return;

    this.app.view.children.remove(child, Layer.States);
    child.parent = parent;
    parent.children.add(child, Layer.States);
  }

  private createTransitionView(id: string, transitionData: DataTransition) {
    const transition = new Transition(this.app, id, transitionData);
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

  private createFinalStateView(id: string, finalStateData: DataFinalState) {
    const state = new FinalState(this.app, id, finalStateData);
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

  private createChoiceStateView(id: string, choiceStateData: DataChoiceState) {
    const state = new ChoiceState(this.app, id, choiceStateData);
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
