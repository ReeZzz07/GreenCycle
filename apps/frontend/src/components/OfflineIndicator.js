import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Alert, Group, Text } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { checkOnlineStatus, addOnlineStatusListener } from '../utils/pwa';
export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(checkOnlineStatus());
    useEffect(() => {
        const unsubscribe = addOnlineStatusListener(setIsOnline);
        return unsubscribe;
    }, []);
    if (isOnline) {
        return null;
    }
    return (_jsx(Alert, { color: "orange", icon: _jsx(IconWifiOff, { size: 16 }), title: "\u041D\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443", styles: {
            root: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                borderRadius: 0,
            },
        }, children: _jsx(Group, { gap: "xs", children: _jsx(Text, { size: "sm", children: "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 offline. \u041D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B." }) }) }));
}
