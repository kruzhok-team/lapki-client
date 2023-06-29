import { EventEmitter } from '../common/EventEmitter';

export class Keyboard extends EventEmitter<KeyboardEvent> {
  spacePressed = false;
  ctrlPressed = false;

  constructor() {
    super();

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  cleanUp() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
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
  };

  handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePressed = false;

      this.emit('spaceup', e);
    }

    if (e.code === 'ControlLeft') {
      this.ctrlPressed = false;

      this.emit('ctrlup', e);
    }
  };
}
