import { useEffect, useRef } from 'react';
export function useTableCardLabels(viewMode, deps = []) {
    const tableRef = useRef(null);
    useEffect(() => {
        if (viewMode !== 'cards') {
            return;
        }
        const table = tableRef.current;
        if (!table) {
            return;
        }
        const headerCells = Array.from(table.querySelectorAll('thead th'));
        const labels = headerCells.map((cell) => cell.textContent?.trim() || '');
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        rows.forEach((row) => {
            const cells = Array.from(row.children);
            cells.forEach((cell, index) => {
                if (cell instanceof HTMLTableCellElement) {
                    cell.dataset.label = labels[index] ?? '';
                }
            });
        });
    }, [viewMode, ...deps]);
    return tableRef;
}
