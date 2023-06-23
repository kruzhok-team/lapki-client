import { EventEmitter } from '../common/EventEmitter';

export class Keyboard extends EventEmitter<KeyboardEvent> {
  spacePressed = false;

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

    this.emit('keydown', e);
  };

  handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spacePressed = false;
    }

    this.emit('keyup', e);
  };
}
