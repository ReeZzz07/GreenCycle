import { apiClient } from '../config/api';
export const authService = {
    async login(credentials) {
        const response = await apiClient.post('/auth/login', credentials);
        const { accessToken, refreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        return { accessToken, refreshToken };
    },
    async refresh() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('Refresh token не найден');
        }
        const response = await apiClient.post('/auth/refresh', {
            refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return { accessToken, refreshToken: newRefreshToken };
    },
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },
    getAccessToken() {
        return localStorage.getItem('accessToken');
    },
};
