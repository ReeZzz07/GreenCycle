import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ClientsPage } from './pages/ClientsPage';
import { SalesPage } from './pages/SalesPage';
import { BuybacksPage } from './pages/BuybacksPage';
import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SuppliersPage } from './pages/SuppliersPage';
import { UsersPage } from './pages/UsersPage';
import { EquityPage } from './pages/EquityPage';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
function AppRoutes() {
    const { isAuthenticated } = useAuthContext();
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/", replace: true }) : _jsx(LoginPage, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(DashboardPage, {}) }) }) }), _jsx(Route, { path: "/shipments", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ShipmentsPage, {}) }) }) }), _jsx(Route, { path: "/inventory", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(InventoryPage, {}) }) }) }), _jsx(Route, { path: "/clients", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ClientsPage, {}) }) }) }), _jsx(Route, { path: "/suppliers", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(SuppliersPage, {}) }) }) }), _jsx(Route, { path: "/sales", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(SalesPage, {}) }) }) }), _jsx(Route, { path: "/buybacks", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(BuybacksPage, {}) }) }) }), _jsx(Route, { path: "/finance", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(FinancePage, {}) }) }) }), _jsx(Route, { path: "/reports", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ReportsPage, {}) }) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(ProfilePage, {}) }) }) }), _jsx(Route, { path: "/users", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsx(UsersPage, {}) }) }) }), _jsx(Route, { path: "/equity", element: _jsx(ProtectedRoute, { requiredRoles: ['super_admin'], children: _jsx(AppLayout, { children: _jsx(EquityPage, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
export function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(MantineProvider, { theme: theme, children: [_jsx(OfflineIndicator, {}), _jsx(Notifications, {}), _jsx(BrowserRouter, { future: {
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                    }, children: _jsx(AuthProvider, { children: _jsx(AppRoutes, {}) }) })] }) }));
}
