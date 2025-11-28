import axios from 'axios';
import { offlineQueue } from '../utils/offline-queue';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 секунд таймаут
});
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
apiClient.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    // Обработка offline режима
    if (!navigator.onLine ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error') {
        // Если это POST, PUT, DELETE запрос, добавляем в очередь
        if (originalRequest &&
            originalRequest.method &&
            ['post', 'put', 'delete', 'patch'].includes(originalRequest.method.toLowerCase())) {
            // Извлекаем путь без baseURL
            const url = originalRequest.url?.replace(API_BASE_URL, '') || '';
            const queueId = offlineQueue.add({
                method: originalRequest.method.toUpperCase(),
                url,
                data: originalRequest.data ? JSON.parse(JSON.stringify(originalRequest.data)) : undefined,
                headers: originalRequest.headers,
            });
            // Возвращаем специальную ошибку для обработки в компонентах
            const offlineError = Object.assign(new Error('Запрос добавлен в очередь для отправки при восстановлении соединения'), {
                isOffline: true,
                queueId,
            });
            return Promise.reject(offlineError);
        }
        // Для GET запросов просто отклоняем с ошибкой offline
        const offlineError = Object.assign(new Error('Нет подключения к интернету'), {
            isOffline: true,
        });
        return Promise.reject(offlineError);
    }
    // Обработка 401 ошибки (неавторизован)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                const { accessToken } = response.data.data;
                localStorage.setItem('accessToken', accessToken);
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return apiClient(originalRequest);
            }
            catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                // Отправляем событие для обновления состояния авторизации
                window.dispatchEvent(new Event('storage'));
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        else {
            // Если refreshToken отсутствует, сразу перенаправляем на логин
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // Отправляем событие для обновления состояния авторизации
            window.dispatchEvent(new Event('storage'));
            window.location.href = '/login';
            return Promise.reject(error);
        }
    }
    // Если это 401 ошибка, но запрос уже был повторен или нет originalRequest, перенаправляем на логин
    if (error.response?.status === 401) {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            localStorage.removeItem('refreshToken');
            // Отправляем событие для обновления состояния авторизации
            window.dispatchEvent(new Event('storage'));
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
