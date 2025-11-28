import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconLayoutGrid, IconTable } from '@tabler/icons-react';

type DataViewMode = 'table' | 'cards';

interface DataViewToggleProps {
  value: DataViewMode;
  onChange: (mode: DataViewMode) => void;
}

export function DataViewToggle({ value, onChange }: DataViewToggleProps) {
  return (
    <Group gap={4}>
      <Tooltip label="Таблица">
        <ActionIcon
          variant={value === 'table' ? 'filled' : 'subtle'}
          color="greenCycle"
          onClick={() => onChange('table')}
          aria-label="Просмотр таблицей"
        >
          <IconTable size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Плитки">
        <ActionIcon
          variant={value === 'cards' ? 'filled' : 'subtle'}
          color="greenCycle"
          onClick={() => onChange('cards')}
          aria-label="Просмотр плитками"
        >
          <IconLayoutGrid size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

