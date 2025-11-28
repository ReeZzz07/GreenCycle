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
  Modal as MantineModal,
  Textarea,
  Divider,
} from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { suppliersService } from '../services/suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, Supplier } from '../types/suppliers';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';

export function SuppliersPage() {
  const [opened, setOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'suppliers-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersService.getAll(search || undefined),
  });
  const tableRef = useTableCardLabels(viewMode, [suppliers]);

  const form = useForm<CreateSupplierDto>({
    initialValues: {
      name: '',
      contactInfo: '',
      contactPerson: '',
      phone: '',
      address: '',
      legalEntityName: '',
      inn: '',
      kpp: '',
      ogrn: '',
      bankName: '',
      bankAccount: '',
      correspondentAccount: '',
      bik: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Укажите название поставщика'),
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSupplierDto) => suppliersService.create(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Поставщик создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать поставщика',
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateSupplierDto }) =>
      suppliersService.update(id, dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Поставщик обновлён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpened(false);
      setEditingSupplier(null);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось обновить поставщика',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Поставщик удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить поставщика',
        color: 'red',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    form.reset();
    setOpened(true);
  };

  const handleOpenEdit = async (id: number) => {
    const supplier = await suppliersService.getById(id);
    form.setValues({
      name: supplier.name,
      contactInfo: supplier.contactInfo || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      legalEntityName: supplier.legalEntityName || '',
      inn: supplier.inn || '',
      kpp: supplier.kpp || '',
      ogrn: supplier.ogrn || '',
      bankName: supplier.bankName || '',
      bankAccount: supplier.bankAccount || '',
      correspondentAccount: supplier.correspondentAccount || '',
      bik: supplier.bik || '',
    });
    setEditingSupplier(id);
    setOpened(true);
  };

  const handleOpenView = async (id: number) => {
    const supplier = await suppliersService.getById(id);
    setViewingSupplier(supplier);
    setViewModalOpened(true);
  };

  const handleSubmit = (values: CreateSupplierDto) => {
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier, dto: values });
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Поставщики
            </Title>
            <Text c="dimmed">Каталог поставщиков и их контакты</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            Создать поставщика
          </Button>
        </Group>

        <TextInput
          placeholder="Поиск по названию или контактам..."
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
                <Table.Th>Название</Table.Th>
                <Table.Th>Контактное лицо</Table.Th>
                <Table.Th>Телефон</Table.Th>
                <Table.Th>Дата создания</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {suppliers?.map((supplier) => (
                <Table.Tr key={supplier.id}>
                  <Table.Td>#{supplier.id}</Table.Td>
                  <Table.Td>{supplier.name}</Table.Td>
                  <Table.Td>
                    {supplier.contactPerson ? (
                      <Text>{supplier.contactPerson}</Text>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {supplier.phone ? (
                      <Text>{supplier.phone}</Text>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>{formatDate(supplier.createdAt)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Просмотр">
                        <ActionIcon
                          variant="subtle"
                          color="greenCycle"
                          onClick={() => handleOpenView(supplier.id)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Редактировать">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleOpenEdit(supplier.id)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => deleteMutation.mutate(supplier.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Модальное окно создания/редактирования */}
        <MantineModal
          opened={opened}
          onClose={() => {
            setOpened(false);
            setEditingSupplier(null);
            form.reset();
          }}
          title={editingSupplier ? 'Редактировать поставщика' : 'Создать поставщика'}
          centered
          size="xl"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Название поставщика"
                required
                placeholder="Введите название"
                {...form.getInputProps('name')}
              />

              <Divider label="Контактная информация" labelPosition="left" />

              <TextInput
                label="Контактное лицо"
                placeholder="ФИО контактного лица"
                {...form.getInputProps('contactPerson')}
              />
              <TextInput
                label="Телефон"
                placeholder="+7 (999) 123-45-67"
                {...form.getInputProps('phone')}
              />
              <Textarea
                label="Адрес"
                placeholder="Полный адрес поставщика"
                minRows={2}
                {...form.getInputProps('address')}
              />
              <Textarea
                label="Дополнительная контактная информация"
                placeholder="Email, другие контакты и т.д."
                minRows={2}
                {...form.getInputProps('contactInfo')}
              />

              <Divider label="Данные юридического лица" labelPosition="left" />

              <TextInput
                label="Название юридического лица"
                placeholder="Полное наименование организации"
                {...form.getInputProps('legalEntityName')}
              />
              <Group grow>
                <TextInput
                  label="ИНН"
                  placeholder="10 или 12 цифр"
                  {...form.getInputProps('inn')}
                />
                <TextInput
                  label="КПП"
                  placeholder="9 цифр"
                  {...form.getInputProps('kpp')}
                />
              </Group>
              <TextInput
                label="ОГРН"
                placeholder="13 или 15 цифр"
                {...form.getInputProps('ogrn')}
              />

              <Divider label="Банковские реквизиты" labelPosition="left" />

              <TextInput
                label="Название банка"
                placeholder="Полное наименование банка"
                {...form.getInputProps('bankName')}
              />
              <Group grow>
                <TextInput
                  label="Расчетный счет"
                  placeholder="20 цифр"
                  {...form.getInputProps('bankAccount')}
                />
                <TextInput
                  label="Корреспондентский счет"
                  placeholder="20 цифр"
                  {...form.getInputProps('correspondentAccount')}
                />
              </Group>
              <TextInput
                label="БИК"
                placeholder="9 цифр"
                {...form.getInputProps('bik')}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setOpened(false);
                    setEditingSupplier(null);
                    form.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSupplier ? 'Сохранить' : 'Создать'}
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        {/* Модальное окно просмотра */}
        <MantineModal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setViewingSupplier(null);
          }}
          title="Информация о поставщике"
          centered
          size="lg"
        >
          {viewingSupplier && (
            <Stack>
              <Paper withBorder p="md">
                <Stack gap="md">
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      ID
                    </Text>
                    <Text fw={500}>#{viewingSupplier.id}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Название
                    </Text>
                    <Text fw={500}>{viewingSupplier.name}</Text>
                  </div>

                  <Divider label="Контактная информация" labelPosition="left" />

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Контактное лицо
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.contactPerson || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Телефон
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.phone || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Адрес
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.address || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Дополнительная контактная информация
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.contactInfo || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>

                  <Divider label="Данные юридического лица" labelPosition="left" />

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Название юридического лица
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.legalEntityName || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>
                  <Group grow>
                    <div>
                      <Text size="sm" c="dimmed" mb={4}>
                        ИНН
                      </Text>
                      <Text fw={500}>
                        {viewingSupplier.inn || (
                          <Text c="dimmed" fs="italic">
                            Не указано
                          </Text>
                        )}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed" mb={4}>
                        КПП
                      </Text>
                      <Text fw={500}>
                        {viewingSupplier.kpp || (
                          <Text c="dimmed" fs="italic">
                            Не указано
                          </Text>
                        )}
                      </Text>
                    </div>
                  </Group>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      ОГРН
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.ogrn || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>

                  <Divider label="Банковские реквизиты" labelPosition="left" />

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Название банка
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.bankName || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>
                  <Group grow>
                    <div>
                      <Text size="sm" c="dimmed" mb={4}>
                        Расчетный счет
                      </Text>
                      <Text fw={500}>
                        {viewingSupplier.bankAccount || (
                          <Text c="dimmed" fs="italic">
                            Не указано
                          </Text>
                        )}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" c="dimmed" mb={4}>
                        Корреспондентский счет
                      </Text>
                      <Text fw={500}>
                        {viewingSupplier.correspondentAccount || (
                          <Text c="dimmed" fs="italic">
                            Не указано
                          </Text>
                        )}
                      </Text>
                    </div>
                  </Group>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      БИК
                    </Text>
                    <Text fw={500}>
                      {viewingSupplier.bik || (
                        <Text c="dimmed" fs="italic">
                          Не указано
                        </Text>
                      )}
                    </Text>
                  </div>

                  <Divider />

                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Дата создания
                    </Text>
                    <Text fw={500}>{formatDate(viewingSupplier.createdAt)}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Последнее обновление
                    </Text>
                    <Text fw={500}>{formatDate(viewingSupplier.updatedAt)}</Text>
                  </div>
                </Stack>
              </Paper>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setViewModalOpened(false);
                    setViewingSupplier(null);
                  }}
                >
                  Закрыть
                </Button>
                <Button
                  onClick={() => {
                    setViewModalOpened(false);
                    handleOpenEdit(viewingSupplier.id);
                  }}
                >
                  Редактировать
                </Button>
              </Group>
            </Stack>
          )}
        </MantineModal>
      </Stack>
    </Container>
  );
}

