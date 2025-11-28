import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { usersService } from '../services/users.service';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const { login: loginFn, logout: logoutFn, isAuthenticated } = useAuth();
    const [user, setUser] = useState(null);
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading: isLoadingUser, error: userError } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => usersService.getCurrentUser(),
        enabled: isAuthenticated,
        retry: false,
        throwOnError: false,
    });
    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
        }
        else if (!isAuthenticated) {
            setUser(null);
        }
    }, [currentUser, isAuthenticated]);
    useEffect(() => {
        // Игнорируем 401 ошибки - это нормально, если пользователь не авторизован
        if (userError && userError?.response?.status !== 401) {
            console.error('Ошибка при получении данных пользователя:', userError);
        }
    }, [userError]);
    const login = async (email, password) => {
        await loginFn({ email, password });
    };
    const logout = () => {
        logoutFn();
        setUser(null);
    };
    const refreshUser = async () => {
        await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isAuthenticated,
            login,
            logout,
            isLoading: isLoadingUser,
            refreshUser,
        }, children: children }));
};
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};
