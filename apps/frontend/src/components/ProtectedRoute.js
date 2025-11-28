import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { Loader, Center } from '@mantine/core';
import { useAuthContext } from '../contexts/AuthContext';
export function ProtectedRoute({ children, requiredRoles, }) {
    const { isAuthenticated, isLoading, user } = useAuthContext();
    if (isLoading) {
        return (_jsx(Center, { h: "100vh", children: _jsx(Loader, { size: "lg", color: "greenCycle" }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (requiredRoles && user && !requiredRoles.includes(user.role.name)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
