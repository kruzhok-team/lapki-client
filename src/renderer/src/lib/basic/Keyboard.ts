import { EventEmitter } from '@renderer/lib/common';

/**
 * Обработчик событий, связанных со взаимодействием мыши и {@link Canvas}.
 * Оборачивает браузерные события, происходящие на холсте, и фильтрует из них
 * связанные с необходимыми для работы клавишами.
 */
interface KeyboardEvents {
  spacedown: KeyboardEvent;
  spaceup: KeyboardEvent;
  ctrldown: KeyboardEvent;
  ctrlup: KeyboardEvent;
  shiftdown: KeyboardEvent;
  shiftup: KeyboardEvent;
  delete: KeyboardEvent;
  ctrlp: KeyboardEvent;
  ctrlz: KeyboardEvent;
  ctrly: KeyboardEvent;
  ctrlc: KeyboardEvent;
  ctrlv: KeyboardEvent;
  ctrld: KeyboardEvent;
  ctrls: KeyboardEvent;
  ctrlshifta: KeyboardEvent;
}

export class Keyboard extends EventEmitter<KeyboardEvents> {
  spacePressed = false;
  ctrlPressed = false;
  shiftPressed = false;

  constructor(public element: HTMLElement) {
    super();

    this.element.addEventListener('keydown', this.handleKeyDown);
    this.element.addEventListener('keyup', this.handleKeyUp);
  }

  cleanUp() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.removeEventListener('keyup', this.handleKeyUp);

    this.reset();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !this.spacePressed) {
      this.spacePressed = true;
      this.emit('spacedown', e);
    }

    if (e.code === 'ControlLeft' && !this.ctrlPressed) {
      this.ctrlPressed = true;
      this.emit('ctrldown', e);
    }

    if (e.code === 'ShiftLeft' && !this.shiftPressed) {
      this.shiftPressed = true;
      this.emit('shiftdown', e);
    }
  };

  handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePressed = false;
      this.emit('spaceup', e);
    }

    if (e.code === 'ShiftLeft') {
      this.shiftPressed = false;
      this.emit('shiftup', e);
    }

    if (e.code === 'ControlLeft') {
      this.ctrlPressed = false;
      this.emit('ctrlup', e);
    }

    if (e.key === 'Delete') {
      this.emit('delete', e);
    }

    if (e.ctrlKey) {
      if (e.code === 'KeyP') {
        this.emit('ctrlp', e);
        return;
      }
      if (e.code === 'KeyZ') {
        this.emit('ctrlz', e);
        return;
      }
      if (e.code === 'KeyY') {
        this.emit('ctrly', e);
        return;
      }
      if (e.code === 'KeyC') {
        this.emit('ctrlc', e);
        return;
      }
      if (e.code === 'KeyV') {
        this.emit('ctrlv', e);
        return;
      }
      if (e.code === 'KeyD') {
        this.emit('ctrld', e);
        return;
      }
      if (e.code === 'KeyS') {
        this.emit('ctrls', e);
        return;
      }
    }
    if (e.ctrlKey && e.shiftKey) {
      if (e.code === 'KeyA') {
        this.emit('ctrlshifta', e);
        return;
      }
    }
  };
}
