import {
  Group,
  Burger,
  TextInput,
  ActionIcon,
  Menu,
  Avatar,
  Badge,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconBell,
  IconUser,
  IconLogout,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { notificationsService } from '../../services/notifications.service';
import { useQuery } from '@tanstack/react-query';

interface AppHeaderProps {
  opened: boolean;
  toggle: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

export function AppHeader({ opened, toggle, isCompact, toggleCompact }: AppHeaderProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuthContext();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: !!user, // Запрос только если пользователь авторизован
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'АД';
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={toggleCompact}
          visibleFrom="sm"
          aria-label="Переключить ширину меню"
        >
          {isCompact ? (
            <IconLayoutSidebarRightExpand size={18} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={18} />
          )}
        </ActionIcon>
      </Group>
      <TextInput
        placeholder="Поиск..."
        leftSection={<IconSearch size={16} />}
        style={{ flex: 1, maxWidth: 400 }}
      />
      <Group gap="xs">
        <Box pos="relative" style={{ cursor: 'pointer' }}>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => navigate('/notifications')}
          >
            <IconBell size={20} />
          </ActionIcon>
          {unreadCount && unreadCount > 0 && (
            <Badge
              size="xs"
              circle
              color="red"
              style={{ position: 'absolute', top: -2, right: -2 }}
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Avatar color="greenCycle" radius="xl" style={{ cursor: 'pointer' }}>
              {getInitials()}
            </Avatar>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Аккаунт</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              component={Link}
              to="/profile"
            >
              Профиль
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Выход
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}