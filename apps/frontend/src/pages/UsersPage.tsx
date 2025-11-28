import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Group,
  Button,
  TextInput,
  ActionIcon,
  Tooltip,
  Badge,
  Modal as MantineModal,
  Select,
  PasswordInput,
} from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { usersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto, User } from '../types/users';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
import { useAuthContext } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Супер-администратор',
  admin: 'Администратор',
  manager: 'Менеджер',
  accountant: 'Бухгалтер',
  logistic: 'Логист',
};

export function UsersPage() {
  const { user: currentUser } = useAuthContext();
  const isAdmin = currentUser?.role.name === 'admin' || currentUser?.role.name === 'super_admin';
  
  const [opened, setOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'users-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
    enabled: isAdmin, // Только админы могут видеть список пользователей
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      ROLE_LABELS[user.role.name]?.toLowerCase().includes(search.toLowerCase()),
  );
  const tableRef = useTableCardLabels(viewMode, [filteredUsers]);

  const form = useForm<CreateUserDto>({
    initialValues: {
      email: '',
      password: '',
      fullName: '',
      roleName: 'manager',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Некорректный email'),
      password: (value, values) => {
        if (!editingUser && !value) return 'Пароль обязателен';
        if (value && value.length < 6) return 'Пароль должен содержать минимум 6 символов';
        return null;
      },
      fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО'),
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersService.create(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Пользователь создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось создать пользователя';
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        } else if (Array.isArray(error.response.data.error.message)) {
          errorMessage = error.response.data.error.message.join(', ');
        }
      } else if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) =>
      usersService.update(id, dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Пользователь обновлён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpened(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось обновить пользователя';
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        } else if (Array.isArray(error.response.data.error.message)) {
          errorMessage = error.response.data.error.message.join(', ');
        }
      } else if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Пользователь удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось удалить пользователя';
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        } else if (Array.isArray(error.response.data.error.message)) {
          errorMessage = error.response.data.error.message.join(', ');
        }
      } else if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    form.reset();
    setOpened(true);
  };

  const handleOpenEdit = async (id: number) => {
    const user = await usersService.getById(id);
    form.setValues({
      email: user.email,
      password: '', // Пароль не заполняем при редактировании
      fullName: user.fullName,
      roleName: user.role.name as CreateUserDto['roleName'],
    });
    setEditingUser(id);
    setOpened(true);
  };

  const handleSubmit = (values: CreateUserDto | UpdateUserDto) => {
    if (editingUser) {
      const updateDto: UpdateUserDto = {
        email: values.email,
        fullName: values.fullName,
        roleName: values.roleName,
      };
      // Пароль добавляем только если он указан
      if (values.password && values.password.length > 0) {
        updateDto.password = values.password;
      }
      updateMutation.mutate({ id: editingUser, dto: updateDto });
    } else {
      createMutation.mutate(values as CreateUserDto);
    }
  };

  if (!isAdmin) {
    return (
      <Container size="xl">
        <Stack gap="xl">
          <Title order={1}>Пользователи</Title>
          <Text c="dimmed">У вас нет доступа к этой странице</Text>
        </Stack>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Пользователи
            </Title>
            <Text c="dimmed">Управление пользователями системы</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            Создать пользователя
          </Button>
        </Group>

        <TextInput
          placeholder="Поиск по ФИО, email, роли..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ maxWidth: 400 }}
        />

        <Group justify="flex-end">
          <DataViewToggle value={viewMode} onChange={setViewMode} />
        </Group>
        <Paper withBorder mt="sm">
          <Table
            ref={tableRef}
            className="gc-data-table"
            data-view={viewMode}
            striped
            highlightOnHover
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>ФИО</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Роль</Table.Th>
                <Table.Th>Дата создания</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>#{user.id}</Table.Td>
                    <Table.Td>{user.fullName}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          user.role.name === 'super_admin'
                            ? 'red'
                            : user.role.name === 'admin'
                              ? 'orange'
                              : 'blue'
                        }
                        variant="light"
                      >
                        {ROLE_LABELS[user.role.name] || user.role.name}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(user.createdAt)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Просмотр">
                          <ActionIcon
                            variant="subtle"
                            color="greenCycle"
                            onClick={() => {
                              setSelectedUser(user);
                              setViewModalOpened(true);
                            }}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Редактировать">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleOpenEdit(user.id)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Удалить">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Вы уверены, что хотите удалить пользователя "${user.fullName}"? Это действие нельзя отменить.`,
                                )
                              ) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            disabled={user.id === currentUser?.id} // Нельзя удалить самого себя
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                    <Text c="dimmed" py="md">
                      Пользователи не найдены
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <MantineModal
          opened={opened}
          onClose={() => {
            setOpened(false);
            setEditingUser(null);
            form.reset();
          }}
          title={editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
          centered
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Email"
                required
                type="email"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Пароль"
                required={!editingUser}
                description={editingUser ? 'Оставьте пустым, если не хотите менять пароль' : ''}
                {...form.getInputProps('password')}
              />
              <TextInput
                label="ФИО"
                required
                {...form.getInputProps('fullName')}
              />
              <Select
                label="Роль"
                required
                data={[
                  { value: 'super_admin', label: 'Супер-администратор' },
                  { value: 'admin', label: 'Администратор' },
                  { value: 'manager', label: 'Менеджер' },
                  { value: 'accountant', label: 'Бухгалтер' },
                  { value: 'logistic', label: 'Логист' },
                ]}
                {...form.getInputProps('roleName')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setOpened(false);
                    setEditingUser(null);
                    form.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingUser ? 'Сохранить' : 'Создать'}
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setSelectedUser(null);
          }}
          title={`Пользователь #${selectedUser?.id || ''}`}
          centered
          size="lg"
        >
          {selectedUser && (
            <Stack gap="md">
              <Group>
                <Text fw={600}>ID:</Text>
                <Text>#{selectedUser.id}</Text>
              </Group>
              <Group>
                <Text fw={600}>ФИО:</Text>
                <Text>{selectedUser.fullName}</Text>
              </Group>
              <Group>
                <Text fw={600}>Email:</Text>
                <Text>{selectedUser.email}</Text>
              </Group>
              <Group>
                <Text fw={600}>Роль:</Text>
                <Badge
                  color={
                    selectedUser.role.name === 'super_admin'
                      ? 'red'
                      : selectedUser.role.name === 'admin'
                        ? 'orange'
                        : 'blue'
                  }
                  variant="light"
                >
                  {ROLE_LABELS[selectedUser.role.name] || selectedUser.role.name}
                </Badge>
              </Group>
              <Group>
                <Text fw={600}>Дата создания:</Text>
                <Text>{formatDate(selectedUser.createdAt)}</Text>
              </Group>
              {selectedUser.updatedAt !== selectedUser.createdAt && (
                <Group>
                  <Text fw={600}>Дата обновления:</Text>
                  <Text>{formatDate(selectedUser.updatedAt)}</Text>
                </Group>
              )}
            </Stack>
          )}
        </MantineModal>
      </Stack>
    </Container>
  );
}

