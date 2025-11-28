import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types/auth';
import { usersService } from '../services/users.service';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { login: loginFn, logout: logoutFn, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersService.getCurrentUser(),
    enabled: isAuthenticated,
    retry: false,
    throwOnError: false,
    onError: (error: any) => {
      // Игнорируем 401 ошибки - это нормально, если пользователь не авторизован
      if (error?.response?.status !== 401) {
        console.error('Ошибка при получении данных пользователя:', error);
      }
    },
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (!isAuthenticated) {
      setUser(null);
    }
  }, [currentUser, isAuthenticated]);

  const login = async (email: string, password: string) => {
    await loginFn({ email, password });
  };

  const logout = () => {
    logoutFn();
    setUser(null);
  };

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        isLoading: isLoadingUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
