import { jsx as _jsx } from "react/jsx-runtime";
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
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
// Регистрируем Service Worker для PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    registerServiceWorker();
}
