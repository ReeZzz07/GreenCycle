import { Table, ScrollArea, Paper } from '@mantine/core';
import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Нет данных',
}: DataTableProps<T>) {
  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (data.length === 0) {
    return (
      <Paper p="xl" ta="center" c="dimmed">
        {emptyMessage}
      </Paper>
    );
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={column.key}>{column.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((row, index) => (
            <Table.Tr key={index}>
              {columns.map((column) => (
                <Table.Td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : column.accessor
                      ? column.accessor(row)
                      : (row[column.key] as string)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
