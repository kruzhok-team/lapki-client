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
      // TODO: сделать более понятный экран для пользователей
      const buttonStyle = 'text-2xl text-white rounded-md bg-slate-600 p-1 w-[200px]';
      return (
        <div className="loading-overlay">
          <div className="flex select-none flex-col items-center text-white">
            <CatError />
            <p className="text-3xl italic ">Хьюстон, срочно проверьте лоток</p>
            <p className="text-sm italic">
              Lapki IDE сделала что-то не то, подробности в{' '}
              <a className="font-bold" onClick={() => this.openDevTools()}>
                консоли
              </a>
            </p>
            <br />
            <button onClick={() => this.unwhoopsie()} className={buttonStyle}>
              Игнорировать
            </button>
            <p className="pb-1 text-xs italic">(не рекомендуется)</p>
            <button onClick={() => location.reload()} className={buttonStyle}>
              Перезапуск
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
