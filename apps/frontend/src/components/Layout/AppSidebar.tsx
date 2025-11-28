import {
  Stack,
  Text,
  ThemeIcon,
  ScrollArea,
  NavLink as MantineNavLink,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconPackage,
  IconTrendingUp,
  IconRefresh,
  IconCurrencyDollar,
  IconChartBar,
  IconUsers,
  IconUser,
  IconDashboard,
  IconTruck,
  IconUserCircle,
  IconChartPie,
} from '@tabler/icons-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

type MenuItem = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  path: string;
  roles?: string[];
};

const menuItems: MenuItem[] = [
  { icon: IconDashboard, label: 'Дашборд', path: '/' },
  { icon: IconShoppingCart, label: 'Закупки', path: '/shipments' },
  { icon: IconPackage, label: 'Склад', path: '/inventory' },
  { icon: IconTrendingUp, label: 'Продажи', path: '/sales' },
  { icon: IconRefresh, label: 'Выкуп', path: '/buybacks' },
  { icon: IconCurrencyDollar, label: 'Финансы', path: '/finance' },
  { icon: IconChartBar, label: 'Отчёты', path: '/reports' },
  { icon: IconUsers, label: 'Клиенты', path: '/clients' },
  { icon: IconTruck, label: 'Поставщики', path: '/suppliers' },
  { icon: IconUserCircle, label: 'Пользователи', path: '/users', roles: ['admin', 'super_admin'] },
  { icon: IconChartPie, label: 'Доли владельцев', path: '/equity', roles: ['super_admin'] },
  { icon: IconUser, label: 'Профиль', path: '/profile' },
];

interface AppSidebarProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ compact = false, onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const { user } = useAuthContext();

  // Фильтруем элементы меню в зависимости от роли пользователя
  const filteredMenuItems = menuItems.filter((item) => {
    // Если указаны роли, проверяем доступ
    if (item.roles && user) {
      return item.roles.includes(user.role.name);
    }
    return true;
  });

  return (
    <ScrollArea h="100%">
      <Stack gap="xs" p="md" align={compact ? 'center' : 'stretch'}>
        {compact ? (
          <ThemeIcon size="lg" radius="xl" variant="light" color="greenCycle" mb="md">
            GC
          </ThemeIcon>
        ) : (
          <Text fw={700} size="xl" c="greenCycle.6" mb="md">
            GreenCycle
          </Text>
        )}
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (compact) {
            return (
              <Tooltip label={item.label} position="right" key={item.path}>
                <ActionIcon
                  component={Link}
                  to={item.path}
                  size="xl"
                  variant={isActive ? 'filled' : 'subtle'}
                  color="greenCycle"
                  onClick={onNavigate}
                >
                  <item.icon size={20} />
                </ActionIcon>
              </Tooltip>
            );
          }
          return (
            <MantineNavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={
                <ThemeIcon variant="light" size="md" color="greenCycle">
                  <item.icon size={18} />
                </ThemeIcon>
              }
              active={isActive}
              variant="light"
              color="greenCycle"
              onClick={onNavigate}
            />
          );
        })}
      </Stack>
    </ScrollArea>
  );
}