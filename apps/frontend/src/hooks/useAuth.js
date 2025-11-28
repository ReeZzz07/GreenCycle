import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
export const useAuth = () => {
    const queryClient = useQueryClient();
    const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
    // Слушаем изменения в localStorage для отслеживания токена
    useEffect(() => {
        const checkAuth = () => {
            setIsAuthenticated(authService.isAuthenticated());
        };
        // Проверяем при монтировании
        checkAuth();
        // Слушаем события изменения storage (когда токен удаляется/добавляется)
        const handleStorageChange = (e) => {
            if (e.key === 'accessToken' || e.key === 'refreshToken') {
                checkAuth();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        // Также проверяем периодически (на случай, если токен был удален в том же окне)
        const interval = setInterval(checkAuth, 1000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);
    const loginMutation = useMutation({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: () => {
            setIsAuthenticated(true);
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
    const logoutMutation = useMutation({
        mutationFn: () => {
            authService.logout();
            return Promise.resolve();
        },
        onSuccess: () => {
            setIsAuthenticated(false);
            queryClient.clear();
        },
    });
    return {
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutate,
        isAuthenticated,
        isLoading: loginMutation.isPending,
        error: loginMutation.error,
    };
};
