import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Group, Burger, TextInput, ActionIcon, Menu, Avatar, Badge, Box, } from '@mantine/core';
import { IconSearch, IconBell, IconUser, IconLogout, IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightExpand, } from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { notificationsService } from '../../services/notifications.service';
import { useQuery } from '@tanstack/react-query';
export function AppHeader({ opened, toggle, isCompact, toggleCompact }) {
    const navigate = useNavigate();
    const { logout, user } = useAuthContext();
    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsService.getUnreadCount(),
        enabled: !!user, // Запрос только если пользователь авторизован
        refetchInterval: 30000, // Обновлять каждые 30 секунд
    });
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const getInitials = () => {
        if (user?.fullName) {
            return user.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return 'АД';
    };
    return (_jsxs(Group, { h: "100%", px: "md", justify: "space-between", children: [_jsxs(Group, { gap: "xs", children: [_jsx(Burger, { opened: opened, onClick: toggle, hiddenFrom: "sm", size: "sm" }), _jsx(ActionIcon, { variant: "subtle", size: "lg", onClick: toggleCompact, visibleFrom: "sm", "aria-label": "\u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443 \u043C\u0435\u043D\u044E", children: isCompact ? (_jsx(IconLayoutSidebarRightExpand, { size: 18 })) : (_jsx(IconLayoutSidebarLeftCollapse, { size: 18 })) })] }), _jsx(TextInput, { placeholder: "\u041F\u043E\u0438\u0441\u043A...", leftSection: _jsx(IconSearch, { size: 16 }), style: { flex: 1, maxWidth: 400 } }), _jsxs(Group, { gap: "xs", children: [_jsxs(Box, { pos: "relative", style: { cursor: 'pointer' }, children: [_jsx(ActionIcon, { variant: "subtle", size: "lg", onClick: () => navigate('/notifications'), children: _jsx(IconBell, { size: 20 }) }), unreadCount && unreadCount > 0 && (_jsx(Badge, { size: "xs", circle: true, color: "red", style: { position: 'absolute', top: -2, right: -2 }, children: unreadCount }))] }), _jsxs(Menu, { shadow: "md", width: 200, children: [_jsx(Menu.Target, { children: _jsx(Avatar, { color: "greenCycle", radius: "xl", style: { cursor: 'pointer' }, children: getInitials() }) }), _jsxs(Menu.Dropdown, { children: [_jsx(Menu.Label, { children: "\u0410\u043A\u043A\u0430\u0443\u043D\u0442" }), _jsx(Menu.Item, { leftSection: _jsx(IconUser, { size: 16 }), component: Link, to: "/profile", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx(Menu.Divider, {}), _jsx(Menu.Item, { color: "red", leftSection: _jsx(IconLogout, { size: 16 }), onClick: handleLogout, children: "\u0412\u044B\u0445\u043E\u0434" })] })] })] })] }));
}
