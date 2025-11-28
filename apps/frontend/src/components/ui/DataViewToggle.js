import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconLayoutGrid, IconTable } from '@tabler/icons-react';
export function DataViewToggle({ value, onChange }) {
    return (_jsxs(Group, { gap: 4, children: [_jsx(Tooltip, { label: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430", children: _jsx(ActionIcon, { variant: value === 'table' ? 'filled' : 'subtle', color: "greenCycle", onClick: () => onChange('table'), "aria-label": "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439", children: _jsx(IconTable, { size: 18 }) }) }), _jsx(Tooltip, { label: "\u041F\u043B\u0438\u0442\u043A\u0438", children: _jsx(ActionIcon, { variant: value === 'cards' ? 'filled' : 'subtle', color: "greenCycle", onClick: () => onChange('cards'), "aria-label": "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043F\u043B\u0438\u0442\u043A\u0430\u043C\u0438", children: _jsx(IconLayoutGrid, { size: 18 }) }) })] }));
}
