import { ErrorInfo, Component, ReactNode } from 'react';

// TODO: aтрибуция
// Cat Poop by Denis Sazhin from <a href="https://thenounproject.com/browse/icons/term/cat-poop/" target="_blank" title="Cat Poop Icons">Noun Project</a> (CC BY 3.0)
import { ReactComponent as CatError } from '../assets/icons/cat-error.svg';

export interface WhoopsieScreenProps {
  children: ReactNode;
}

export interface WhoopsieScreenState {
  hasError: boolean;
}

export class WhoopsieScreen extends Component<WhoopsieScreenProps, WhoopsieScreenState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    // Обновляем состояние, чтобы показать заглушку.
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('%c<🙀💩> Что-то пошло не так', 'font-size: 20px');
    console.error(error);
    console.error('%c</🙀💩>', 'font-size: 20px');
  }

  unwhoopsie() {
    this.setState({ hasError: false });
  }

  openDevTools() {
    window.electron.ipcRenderer.invoke('devtools');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-overlay">
          <div className="flex select-none flex-col items-center text-white">
            <CatError />
            <p className="text-3xl italic">Хьюстон, срочно проверьте лоток</p>
            <p className="text-base italic">
              Lapki IDE сделала что-то не то, подробности в{' '}
              <a
                className="rounded border bg-gray-600 px-1 hover:cursor-pointer hover:bg-gray-700"
                onClick={() => this.openDevTools()}
              >
                консоли
              </a>
            </p>
            <br />
            <button onClick={() => this.unwhoopsie()} className="btn-primary w-48 text-xl">
              Игнорировать
            </button>
            <p className="pb-2 text-sm">(не рекомендуется)</p>
            <button onClick={() => location.reload()} className="btn-primary w-48 text-xl">
              Перезапустить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
