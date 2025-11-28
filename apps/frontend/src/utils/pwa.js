export function registerServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
        // Динамически импортируем виртуальный модуль только в production
        // Используем type assertion, так как это виртуальный модуль vite-plugin-pwa
        // @ts-expect-error - virtual module доступен только во время сборки
        import('virtual:pwa-register/react')
            .then((module) => {
            const updateSW = module.registerSW({
                onNeedRefresh() {
                    // Показываем уведомление пользователю о доступном обновлении
                    if (confirm('Доступна новая версия приложения. Обновить?')) {
                        updateSW(true);
                    }
                },
                onOfflineReady() {
                    console.log('Приложение готово к работе offline');
                },
                onRegistered(registration) {
                    console.log('Service Worker зарегистрирован:', registration);
                },
                onRegisterError(error) {
                    console.error('Ошибка регистрации Service Worker:', error);
                },
            });
        })
            .catch((error) => {
            console.warn('Service Worker не может быть зарегистрирован:', error);
        });
    }
}
export function checkOnlineStatus() {
    return navigator.onLine;
}
export function addOnlineStatusListener(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}
