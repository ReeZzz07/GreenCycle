import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
export function AppLayout({ children }) {
    const [opened, { toggle }] = useDisclosure();
    const [isCompact, setIsCompact] = useState(false);
    const handleNavigateInSidebar = useCallback(() => {
        if (opened) {
            toggle();
        }
    }, [opened, toggle]);
    const toggleCompact = useCallback(() => {
        setIsCompact((prev) => !prev);
    }, []);
    return (_jsxs(AppShell, { header: { height: 60 }, navbar: {
            width: isCompact ? 80 : 220,
            breakpoint: 'sm',
            collapsed: { mobile: !opened },
        }, padding: "md", style: {
            '--app-shell-navbar-width': `${isCompact ? 80 : 220}px`,
        }, children: [_jsx(AppShell.Header, { children: _jsx(AppHeader, { opened: opened, toggle: toggle, isCompact: isCompact, toggleCompact: toggleCompact }) }), _jsx(AppShell.Navbar, { children: _jsx(AppSidebar, { compact: isCompact, onNavigate: handleNavigateInSidebar }) }), _jsx(AppShell.Main, { children: children })] }));
}
