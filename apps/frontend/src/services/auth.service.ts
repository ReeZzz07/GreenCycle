import { apiClient } from '../config/api';
import { LoginDto, TokenPairDto, User, AuthResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginDto): Promise<TokenPairDto> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return { accessToken, refreshToken };
  },

  async refresh(): Promise<TokenPairDto> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Refresh token не найден');
    }

    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};
