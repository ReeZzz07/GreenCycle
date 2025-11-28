import { DependencyList, useEffect, useRef } from 'react';

export function useTableCardLabels(
  viewMode: 'table' | 'cards',
  deps: DependencyList = [],
) {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (viewMode !== 'cards') {
      return;
    }
    const table = tableRef.current;
    if (!table) {
      return;
    }
    const headerCells = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'));
    const labels = headerCells.map((cell) => cell.textContent?.trim() || '');
    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
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

