import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { Note } from '@renderer/lib/drawable';
import { ChangeSelectionParams, Layer } from '@renderer/lib/types';
import { Point } from '@renderer/lib/types/graphics';
import {
  ChangeNoteBackgroundColorParams,
  ChangeNoteFontSizeParams,
  ChangeNoteText,
  ChangeNoteTextColorParams,
  CreateNoteParams,
  DeleteDrawableParams,
} from '@renderer/lib/types/ModelTypes';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

interface NotesControllerEvents {
  change: Note;
  mouseUpOnNote: Note;
  startNewTransitionNote: Note;
  contextMenu: { note: Note; position: Point };
}

/**
 * Контроллер {@link Note|заметок}.
 * Обрабатывает события, связанные с ними.
 */
export class NotesController extends EventEmitter<NotesControllerEvents> {
  items: Map<string, Note> = new Map();

  constructor(private app: CanvasEditor) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  initNote = (params: CreateNoteParams) => {
    const { id, smId } = params;
    if (!id) return;
    const note = new Note(this.app, smId, id, { ...params });

    this.items.set(id, note);
    this.watch(note);
    this.view.children.add(note, Layer.Notes);

    this.view.isDirty = true;

    return note;
  };

  createNote = (params: CreateNoteParams) => {
    const note = this.initNote(params);
    if (!note) return;

    this.bindEdgeHandlers(note);
  };

  changeNoteText = (args: ChangeNoteText) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.text = args.text;
    note.prepareText();

    this.view.isDirty = true;
  };

  changeNoteBackgroundColor = (args: ChangeNoteBackgroundColorParams) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.backgroundColor = args.backgroundColor;

    this.view.isDirty = true;
  };

  changeNoteTextColor = (args: ChangeNoteTextColorParams) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.textColor = args.textColor;

    this.view.isDirty = true;
  };

  changeNoteFontSize = (args: ChangeNoteFontSizeParams) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.fontSize = args.fontSize;
    note.prepareText();

    this.view.isDirty = true;
  };

  changeNotePosition = (args: { id: string; endPosition: Point }) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.position = args.endPosition;

    this.view.isDirty = true;
  };

  deleteNote = (args: DeleteDrawableParams) => {
    const { id } = args;
    const note = this.items.get(id);
    if (!note) return;

    this.view.children.remove(note, Layer.Notes);
    this.unwatch(note);
    this.items.delete(id);

    this.view.isDirty = true;
  };

  setIsVisible = (id: string, isVisible: boolean) => {
    const note = this.items.get(id);
    if (!note) return;

    note.setVisible(isVisible);

    this.app.view.isDirty = true;
  };

  handleStartNewTransition = (note: Note) => {
    this.emit('startNewTransitionNote', note);
  };

  changeNoteSelection = (args: ChangeSelectionParams) => {
    const note = this.items.get(args.id);
    if (!note) return;
    note.setIsSelected(args.value);

    this.view.isDirty = true;
  };

  handleMouseUpOnNote = (note: Note) => {
    this.emit('mouseUpOnNote', note);
  };

  handleMouseDown = (note: Note, e: { event: MyMouseEvent }) => {
    if (e.event.nativeEvent.ctrlKey) {
      const prevSelection = note.isSelected;
      note.setIsSelected(!prevSelection);
      this.controller.emit(prevSelection ? 'unselect' : 'addSelection', {
        type: 'note',
        data: { smId: note.smId, id: note.id },
      });
    } else {
      this.controller.selectNote({ smId: note.smId, id: note.id });
      this.controller.emit('selectNote', { smId: note.smId, id: note.id });
    }
    this.view.isDirty = true;
  };

  handleDoubleClick = (note: Note, e: { event: MyMouseEvent }) => {
    if (e.event.nativeEvent.ctrlKey) return;
    this.emit('change', note);
  };

  handleContextMenu = (noteId: string, e: { event: MyMouseEvent }) => {
    const item = this.items.get(noteId);
    if (!item) return;
    this.controller.selectNote({ smId: item.smId, id: noteId });

    this.emit('contextMenu', {
      note: item,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleDragEnd = (note: Note, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    this.changeNotePosition({ id: note.id, endPosition: e.dragEndPosition });
    this.controller.emit('changeNotePositionFromController', {
      id: note.id,
      smId: note.smId,
      endPosition: e.dragEndPosition,
      startPosition: e.dragStartPosition,
    });
  };

  /*
  Мы вынесли это сюда, потому что EdgeHandlers подписывается на события мыши, которой не существует
  на момент инициализации данных, из-за чего происходил краш IDE. И теперь биндим EdgeHandlers в момент маунта канваса.
  */
  bindEdgeHandlers(note: Note) {
    note.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, note);
    note.edgeHandlers.bindEvents();
  }

  watchAll() {
    for (const item of this.items.values()) {
      this.watch(item);
      this.bindEdgeHandlers(item);
    }
  }

  unwatchAll() {
    for (const item of this.items.values()) {
      this.unwatch(item);
    }
  }

  watch(note: Note) {
    note.on('mousedown', this.handleMouseDown.bind(this, note));
    note.on('dblclick', this.handleDoubleClick.bind(this, note));
    note.on('mouseup', this.handleMouseUpOnNote.bind(this, note));
    note.on('contextmenu', this.handleContextMenu.bind(this, note.id));
    note.on('dragend', this.handleDragEnd.bind(this, note));
  }

  unwatch(note: Note) {
    note.handlers.clear();
    // note.off('mousedown', this.handleMouseDown.bind(this, note));
    // note.off('dblclick', this.handleDoubleClick.bind(this, note));
    // note.off('mouseup', this.handleMouseUpOnNote.bind(this, note));
    // note.off('contextmenu', this.handleContextMenu.bind(this, note.id));
    // note.off('dragend', this.handleDragEnd.bind(this, note));

    note.edgeHandlers.unbindEvents();
  }
}
