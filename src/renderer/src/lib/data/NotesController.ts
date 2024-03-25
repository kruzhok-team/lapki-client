import { Point } from '@renderer/types/graphics';
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

  handleDoubleClick = (note: Note) => {
    this.emit('change', note);
  };

  handleContextMenu = (note: Note, e: { event: MyMouseEvent }) => {
    this.emit('contextMenu', { note, position: { x: e.event.x, y: e.event.y } });
  };

  handleDragEnd = (note: Note, e: { dragStartPosition: Point; dragEndPosition: Point }) => {
    this.container.machineController.changeNotePosition(
      note.id,
      e.dragStartPosition,
      e.dragEndPosition
    );
  };

  watch(note: Note) {
    note.on('dblclick', this.handleDoubleClick.bind(this, note));
    note.on('contextmenu', this.handleContextMenu.bind(this, note));
    note.on('dragend', this.handleDragEnd.bind(this, note));
  }

  unwatch(note: Note) {
    note.off('dblclick', this.handleDoubleClick.bind(this, note));
    note.off('contextmenu', this.handleContextMenu.bind(this, note));
    note.off('dragend', this.handleDragEnd.bind(this, note));
  }
}
