import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table, ScrollArea, Paper } from '@mantine/core';
export function DataTable({ data, columns, loading = false, emptyMessage = 'Нет данных', }) {
    if (loading) {
        return _jsx("div", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." });
    }
    if (data.length === 0) {
        return (_jsx(Paper, { p: "xl", ta: "center", c: "dimmed", children: emptyMessage }));
    }
    return (_jsx(ScrollArea, { children: _jsxs(Table, { striped: true, highlightOnHover: true, withTableBorder: true, withColumnBorders: true, children: [_jsx(Table.Thead, { children: _jsx(Table.Tr, { children: columns.map((column) => (_jsx(Table.Th, { children: column.header }, column.key))) }) }), _jsx(Table.Tbody, { children: data.map((row, index) => (_jsx(Table.Tr, { children: columns.map((column) => (_jsx(Table.Td, { children: column.render
                                ? column.render(row)
                                : column.accessor
                                    ? column.accessor(row)
                                    : row[column.key] }, column.key))) }, index))) })] }) }));
}
