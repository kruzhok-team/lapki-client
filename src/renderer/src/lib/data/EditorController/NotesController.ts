import { CanvasEditor } from '@renderer/lib/CanvasEditor';
import { EventEmitter } from '@renderer/lib/common';
import { Note } from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
import { CreateNoteParams } from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

interface NotesControllerEvents {
  change: Note;
  contextMenu: { note: Note; position: Point };
}

/**
 * Контроллер {@link Note|заметок}.
 * Обрабатывает события, связанные с ними.
 */
export class NotesController extends EventEmitter<NotesControllerEvents> {
  private items: Map<string, Note> = new Map();

  constructor(private app: CanvasEditor) {
    super();
  }

  private get view() {
    return this.app.view;
  }

  private get controller() {
    return this.app.controller;
  }

  private get history() {
    return this.app.controller.history;
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  createNote(params: CreateNoteParams, canUndo = true) {
    const newNoteId = this.app.model.createNote(params);
    const note = new Note(this.app, newNoteId);

    this.items.set(newNoteId, note);
    this.watch(note);
    this.view.children.add(note, Layer.Notes);

    this.view.isDirty = true;

    if (canUndo) {
      this.history.do({
        type: 'createNote',
        args: { id: newNoteId, params },
      });
    }

    return note;
  }

  changeNoteText = (id: string, text: string, canUndo = true) => {
    const note = this.items.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNoteText',
        args: { id, text, prevText: note.data.text },
      });
    }

    this.app.model.changeNoteText(id, text);
    note.prepareText();

    this.view.isDirty = true;
  };

  changeNotePosition(id: string, startPosition: Point, endPosition: Point, canUndo = true) {
    const note = this.items.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'changeNotePosition',
        args: { id, startPosition, endPosition },
      });
    }

    this.app.model.changeNotePosition(id, endPosition);

    this.view.isDirty = true;
  }

  deleteNote(id: string, canUndo = true) {
    const note = this.items.get(id);
    if (!note) return;

    if (canUndo) {
      this.history.do({
        type: 'deleteNote',
        args: { id, prevData: structuredClone(note.data) },
      });
    }

    this.app.model.deleteNote(id);

    this.view.children.remove(note, Layer.Notes);
    this.unwatch(note);
    this.items.delete(id);

    this.view.isDirty = true;
  }

  handleMouseDown = (note: Note) => {
    this.controller.selectNote(note.id);
  };

  handleDoubleClick = (note: Note) => {
    this.emit('change', note);
  };

  handleContextMenu = (note: Note, e: { event: MyMouseEvent }) => {
    this.controller.selectNote(note.id);

    const offset = this.app.mouse.getOffset();

    this.emit('contextMenu', {
      note,
      position: { x: e.event.x + offset.x, y: e.event.y + offset.y },
    });
  };

  handleDragEnd = (note: Note, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    this.changeNotePosition(note.id, e.dragStartPosition, e.dragEndPosition);
  };

  watch(note: Note) {
    note.on('mousedown', this.handleMouseDown.bind(this, note));
    note.on('dblclick', this.handleDoubleClick.bind(this, note));
    note.on('contextmenu', this.handleContextMenu.bind(this, note));
    note.on('dragend', this.handleDragEnd.bind(this, note));
  }

  unwatch(note: Note) {
    note.off('mousedown', this.handleMouseDown.bind(this, note));
    note.off('dblclick', this.handleDoubleClick.bind(this, note));
    note.off('contextmenu', this.handleContextMenu.bind(this, note));
    note.off('dragend', this.handleDragEnd.bind(this, note));
  }
}
