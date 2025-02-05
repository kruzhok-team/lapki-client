import { ErrorInfo, Component, ReactNode } from 'react';

// TODO: aтрибуция
// Cat Poop by Denis Sazhin from <a href="https://thenounproject.com/browse/icons/term/cat-poop/" target="_blank" title="Cat Poop Icons">Noun Project</a> (CC BY 3.0)
import { appName, seriousMode } from '@renderer/version';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, _info: ErrorInfo) {
    const headline = !seriousMode ? '🙀⚠' : '⚠';
    console.error('%c<' + headline + '> Что-то пошло не так', 'font-size: 20px');
    console.error(error);
    console.error('%c</' + headline + '>', 'font-size: 20px');
  }

  unwhoopsie() {
    this.setState({ hasError: false });
  }

  openDevTools() {
    window.electron.ipcRenderer.invoke('devtools-open');
  }

  render() {
    if (this.state.hasError) {
      const icon = !seriousMode ? <CatError /> : <></>;
      const headline = !seriousMode ? 'Хьюстон, срочно проверьте лоток' : 'Ой...';
      const baseText = !seriousMode
        ? appName + ' сделала что-то не то, подробности в'
        : appName + ' допустила ошибку, подробнее можно узнать в';

      // TODO: сделать более понятный экран для пользователей
      return (
        <div className="loading-overlay">
          <div className="flex select-none flex-col items-center text-white">
            {icon}
            <p className="text-3xl italic">{headline}</p>
            <p className="text-base italic">
              {baseText}{' '}
              <a
                className="rounded border bg-gray-600 px-1 hover:cursor-pointer hover:bg-gray-700"
                onClick={() => this.openDevTools()}
              >
                консоли
              </a>
              .
            </p>
            <p>Рекомендуем скопировать текст ошибки и передать его разработчикам.</p>
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
