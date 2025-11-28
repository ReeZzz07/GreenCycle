import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { App } from './App';
import { registerServiceWorker } from './utils/pwa';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Не найден элемент #root для монтирования приложения');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Регистрируем Service Worker для PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerServiceWorker();
}

