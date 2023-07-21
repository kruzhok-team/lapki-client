import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';

/*
 Для отладки мы запускаем React в строгом режиме.
 Он отрисовывает виджеты по нескольку раз и выявляет
 типовые ошибки. Это тормозит работу среды при отладке,
 но в релизе оно мешать не будет.
 https://react.dev/reference/react/StrictMode
*/

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
