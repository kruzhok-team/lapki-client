import { Point } from '@renderer/lib/types/graphics';
import { MyMouseEvent } from '@renderer/types/mouse';

import { Container } from '../basic/Container';
import { EventEmitter } from '../common/EventEmitter';
import { Note } from '../drawable/Note';

interface NotesControllerEvents {
  change: Note;
  contextMenu: { note: Note; position: Point };
}

export class NotesController extends EventEmitter<NotesControllerEvents> {
  constructor(public container: Container) {
    super();
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
    this.container.machineController.changeNotePosition(
      note.id,
      e.dragStartPosition,
      e.dragEndPosition
    );
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
