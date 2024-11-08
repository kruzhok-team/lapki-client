import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { Note } from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
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

  createNote = (params: CreateNoteParams) => {
    const { id, smId } = params;
    if (!id) return;
    const note = new Note(this.app, smId, id, { ...params });

    this.items.set(id, note);
    this.watch(note);
    this.view.children.add(note, Layer.Notes);

    this.view.isDirty = true;
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
    // if (canUndo) {
    //   this.history.do({
    //     type: 'changeNoteBackgroundColor',
    //     args: { id, color, prevColor: note.data?.backgroundColor },
    //   });
    // }

    this.view.isDirty = true;
  };

  changeNoteTextColor = (args: ChangeNoteTextColorParams) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.textColor = args.textColor;
    // if (canUndo) {
    //   this.history.do({
    //     type: 'changeNoteTextColor',
    //     args: { id, color, prevColor: note.data?.textColor },
    //   });
    // }

    this.view.isDirty = true;
  };

  changeNoteFontSize = (args: ChangeNoteFontSizeParams) => {
    const note = this.items.get(args.id);
    if (!note) return;

    note.data.fontSize = args.fontSize;
    // if (canUndo) {
    //   this.history.do({
    //     type: 'changeNoteFontSize',
    //     args: { id, fontSize, prevFontSize: note.data?.fontSize },
    //   });
    // }

    // this.app.model.changeNoteFontSize(id, fontSize);
    note.prepareText();

    this.view.isDirty = true;
  };

  changeNotePosition(args: { id: string; endPosition: Point }) {
    const note = this.items.get(args.id);
    if (!note) return;

    note.position = args.endPosition;

    this.view.isDirty = true;
  }

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

  handleMouseUpOnNote = (note: Note) => {
    this.emit('mouseUpOnNote', note);
  };

  handleMouseDown = (note: Note) => {
    this.controller.selectNote({ smId: '', id: note.id });
    this.controller.emit('selectNote', { smId: note.smId, id: note.id });
  };

  handleDoubleClick = (note: Note) => {
    this.emit('change', note);
  };

  handleContextMenu = (noteId: string, e: { event: MyMouseEvent }) => {
    const item = this.items.get(noteId);
    if (!item) return;
    this.controller.selectNote({ smId: '', id: noteId });

    this.emit('contextMenu', {
      note: item,
      position: { x: e.event.nativeEvent.clientX, y: e.event.nativeEvent.clientY },
    });
  };

  handleDragEnd = (note: Note, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    this.changeNotePosition({ id: note.id, endPosition: e.dragEndPosition });
  };

  watch(note: Note) {
    note.on('mousedown', this.handleMouseDown.bind(this, note));
    note.on('dblclick', this.handleDoubleClick.bind(this, note));
    note.on('mouseup', this.handleMouseUpOnNote.bind(this, note));
    note.on('contextmenu', this.handleContextMenu.bind(this, note.id));
    note.on('dragend', this.handleDragEnd.bind(this, note));

    note.edgeHandlers.onStartNewTransition = this.handleStartNewTransition.bind(this, note);
    note.edgeHandlers.bindEvents();
  }

  unwatch(note: Note) {
    note.off('mousedown', this.handleMouseDown.bind(this, note));
    note.off('dblclick', this.handleDoubleClick.bind(this, note));
    note.off('mouseup', this.handleMouseUpOnNote.bind(this, note));
    note.off('contextmenu', this.handleContextMenu.bind(this, note.id));
    note.off('dragend', this.handleDragEnd.bind(this, note));

    note.edgeHandlers.unbindEvents();
  }
}
