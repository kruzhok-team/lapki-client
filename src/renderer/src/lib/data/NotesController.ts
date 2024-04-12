import { Container } from '@renderer/lib/basic';
import { EventEmitter } from '@renderer/lib/common';
import { Note } from '@renderer/lib/drawable';
import { CreateNoteParams } from '@renderer/lib/types/EditorManager';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

import { History } from './History';

import { Layer } from '../types';

interface NotesControllerEvents {
  change: Note;
  contextMenu: { note: Note; position: Point };
}

export class NotesController extends EventEmitter<NotesControllerEvents> {
  private items: Map<string, Note> = new Map();

  constructor(private container: Container, private history: History) {
    super();
  }

  get(id: string) {
    return this.items.get(id);
  }
  forEach(callback: (note: Note) => void) {
    return this.items.forEach(callback);
  }
  clear() {
    return this.items.clear();
  }
  set(id: string, note: Note) {
    return this.items.set(id, note);
  }

  createNote(params: CreateNoteParams, canUndo = true) {
    const newNoteId = this.container.app.manager.createNote(params);
    const note = new Note(this.container, newNoteId);

    this.items.set(newNoteId, note);
    this.watch(note);
    this.container.children.add(note, Layer.Notes);

    this.container.isDirty = true;

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

    this.container.app.manager.changeNoteText(id, text);
    note.prepareText();

    this.container.isDirty = true;
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

    this.container.app.manager.changeNotePosition(id, endPosition);

    this.container.isDirty = true;
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

    this.container.app.manager.deleteNote(id);

    this.container.children.remove(note, Layer.Notes);
    this.unwatch(note);
    this.items.delete(id);

    this.container.isDirty = true;
  }

  handleMouseDown = (note: Note) => {
    this.container.machineController.selectNote(note.id);
  };

  handleDoubleClick = (note: Note) => {
    this.emit('change', note);
  };

  handleContextMenu = (note: Note, e: { event: MyMouseEvent }) => {
    this.container.machineController.selectNote(note.id);

    const offset = this.container.app.mouse.getOffset();

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
