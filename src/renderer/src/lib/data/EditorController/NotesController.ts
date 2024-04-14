import { EditorView } from '@renderer/lib/basic';
import { EventEmitter } from '@renderer/lib/common';
import { History } from '@renderer/lib/data/History';
import { Note } from '@renderer/lib/drawable';
import { Layer } from '@renderer/lib/types';
import { CreateNoteParams } from '@renderer/lib/types/EditorModel';
import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/lib/types/mouse';

interface NotesControllerEvents {
  change: Note;
  contextMenu: { note: Note; position: Point };
}

export class NotesController extends EventEmitter<NotesControllerEvents> {
  private items: Map<string, Note> = new Map();

  constructor(private editorView: EditorView, private history: History) {
    super();
  }

  get = this.items.get.bind(this.items);
  set = this.items.set.bind(this.items);
  clear = this.items.clear.bind(this.items);
  forEach = this.items.forEach.bind(this.items);

  createNote(params: CreateNoteParams, canUndo = true) {
    const newNoteId = this.editorView.app.model.createNote(params);
    const note = new Note(this.editorView, newNoteId);

    this.items.set(newNoteId, note);
    this.watch(note);
    this.editorView.children.add(note, Layer.Notes);

    this.editorView.isDirty = true;

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

    this.editorView.app.model.changeNoteText(id, text);
    note.prepareText();

    this.editorView.isDirty = true;
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

    this.editorView.app.model.changeNotePosition(id, endPosition);

    this.editorView.isDirty = true;
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

    this.editorView.app.model.deleteNote(id);

    this.editorView.children.remove(note, Layer.Notes);
    this.unwatch(note);
    this.items.delete(id);

    this.editorView.isDirty = true;
  }

  handleMouseDown = (note: Note) => {
    this.editorView.editorController.selectNote(note.id);
  };

  handleDoubleClick = (note: Note) => {
    this.emit('change', note);
  };

  handleContextMenu = (note: Note, e: { event: MyMouseEvent }) => {
    this.editorView.editorController.selectNote(note.id);

    const offset = this.editorView.app.mouse.getOffset();

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
