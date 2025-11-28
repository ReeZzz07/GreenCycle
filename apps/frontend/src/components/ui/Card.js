import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Paper, Title, Text, Stack } from '@mantine/core';
export function Card({ title, description, children, ...props }) {
    return (_jsx(Paper, { withBorder: true, p: "md", radius: "md", ...props, children: _jsxs(Stack, { gap: "sm", children: [(title || description) && (_jsxs("div", { children: [title && (_jsx(Title, { order: 4, mb: "xs", children: title })), description && (_jsx(Text, { c: "dimmed", size: "sm", children: description }))] })), children] }) }));
}
