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
  Divider,
  Checkbox,
  FileButton,
  Alert,
} from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconUpload, IconAlertCircle } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { clientsService } from '../services/clients.service';
import { CreateClientDto, UpdateClientDto, ClientType, Client } from '../types/clients';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';

export function ClientsPage() {
  const [opened, setOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'clients-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsService.getAll(search || undefined),
  });
  const tableRef = useTableCardLabels(viewMode, [clients]);

  const form = useForm<CreateClientDto>({
    initialValues: {
      fullName: '',
      phone: '',
      email: '',
      addressFull: '',
      clientType: ClientType.INDIVIDUAL,
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
      fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО'),
      email: (value) =>
        value && value.length > 0 && !/^\S+@\S+$/.test(value)
          ? 'Некорректный email'
          : null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateClientDto) => clientsService.create(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Клиент создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать клиента',
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateClientDto }) =>
      clientsService.update(id, dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Клиент обновлён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setOpened(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось обновить клиента',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Клиент удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить клиента',
        color: 'red',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => clientsService.bulkDelete(ids),
    onSuccess: (result) => {
      if (result.failedCount === 0) {
        notifications.show({
          title: 'Успешно',
          message: `Удалено клиентов: ${result.successCount}`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Частично успешно',
          message: `Удалено: ${result.successCount}, ошибок: ${result.failedCount}`,
          color: 'yellow',
        });
        // Показываем детали ошибок
        result.failed.forEach(({ id, error }) => {
          notifications.show({
            title: `Ошибка удаления клиента #${id}`,
            message: error,
            color: 'red',
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedIds(new Set());
      setBulkDeleteModalOpened(false);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить клиентов',
        color: 'red',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => clientsService.importFromExcel(file),
    onSuccess: (result) => {
      if (result.failedCount === 0) {
        notifications.show({
          title: 'Успешно',
          message: `Импортировано клиентов: ${result.successCount} из ${result.total}`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Частично успешно',
          message: `Импортировано: ${result.successCount} из ${result.total}, ошибок: ${result.failedCount}`,
          color: 'yellow',
        });
        // Показываем первые 5 ошибок
        result.failed.slice(0, 5).forEach(({ row, error }) => {
          notifications.show({
            title: `Ошибка в строке ${row}`,
            message: error,
            color: 'red',
          });
        });
        if (result.failed.length > 5) {
          notifications.show({
            title: 'Внимание',
            message: `И еще ${result.failed.length - 5} ошибок. Проверьте детали в модальном окне.`,
            color: 'yellow',
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setImportFile(null);
      setImportModalOpened(false);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Не удалось импортировать клиентов';
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    form.reset();
    setOpened(true);
  };

  const handleOpenEdit = async (id: number) => {
    const client = await clientsService.getById(id);
    form.setValues({
      fullName: client.fullName,
      phone: client.phone || '',
      email: client.email || '',
      addressFull: client.addressFull || undefined,
      clientType: client.clientType,
      legalEntityName: client.legalEntityName || '',
      inn: client.inn || '',
      kpp: client.kpp || '',
      ogrn: client.ogrn || '',
      bankName: client.bankName || '',
      bankAccount: client.bankAccount || '',
      correspondentAccount: client.correspondentAccount || '',
      bik: client.bik || '',
    });
    setEditingClient(id);
    setOpened(true);
  };

  const handleSubmit = (values: CreateClientDto) => {
    if (editingClient) {
      // При редактировании: отправляем пустые строки для полей, которые нужно очистить.
      // На бэкенде они будут преобразованы в null через @Transform декоратор.
      const updateValues: UpdateClientDto = {
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || '',
        email: values.email?.trim() || '',
        addressFull: values.addressFull?.trim() || '',
        clientType: values.clientType,
        legalEntityName: values.legalEntityName?.trim() || '',
        inn: values.inn?.trim() || '',
        kpp: values.kpp?.trim() || '',
        ogrn: values.ogrn?.trim() || '',
        bankName: values.bankName?.trim() || '',
        bankAccount: values.bankAccount?.trim() || '',
        correspondentAccount: values.correspondentAccount?.trim() || '',
        bik: values.bik?.trim() || '',
      };
      updateMutation.mutate({ id: editingClient, dto: updateValues });
    } else {
      // При создании: преобразуем пустые строки в undefined для опциональных полей
      const cleanValues: CreateClientDto = {
        ...values,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        addressFull: values.addressFull?.trim() || undefined,
        legalEntityName: values.legalEntityName?.trim() || undefined,
        inn: values.inn?.trim() || undefined,
        kpp: values.kpp?.trim() || undefined,
        ogrn: values.ogrn?.trim() || undefined,
        bankName: values.bankName?.trim() || undefined,
        bankAccount: values.bankAccount?.trim() || undefined,
        correspondentAccount: values.correspondentAccount?.trim() || undefined,
        bik: values.bik?.trim() || undefined,
      };
      createMutation.mutate(cleanValues);
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
              Клиенты
            </Title>
            <Text c="dimmed">Каталог клиентов и их история</Text>
          </div>
          <Group>
            {selectedIds.size > 0 && (
              <Button
                color="red"
                variant="light"
                onClick={() => setBulkDeleteModalOpened(true)}
              >
                Удалить выбранные ({selectedIds.size})
              </Button>
            )}
            <FileButton
              onChange={(file) => {
                if (file) {
                  setImportFile(file);
                  setImportModalOpened(true);
                }
              }}
              accept=".xlsx,.xls"
            >
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  leftSection={<IconUpload size={16} />}
                >
                  Импорт из Excel
                </Button>
              )}
            </FileButton>
            <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
              Создать клиента
            </Button>
          </Group>
        </Group>

        <TextInput
          placeholder="Поиск по ФИО, телефону, email..."
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setSelectedIds(new Set()); // Сбрасываем выбор при изменении поиска
          }}
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
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === clients?.length}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < (clients?.length || 0)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedIds(new Set(clients?.map((c) => c.id) || []));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>ФИО</Table.Th>
                <Table.Th>Телефон</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Адрес</Table.Th>
                <Table.Th>Тип</Table.Th>
                <Table.Th>Первая покупка</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clients?.map((client) => (
                <Table.Tr key={client.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.has(client.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedIds);
                        if (e.currentTarget.checked) {
                          newSelected.add(client.id);
                        } else {
                          newSelected.delete(client.id);
                        }
                        setSelectedIds(newSelected);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>#{client.id}</Table.Td>
                  <Table.Td>{client.fullName}</Table.Td>
                  <Table.Td>{client.phone || '-'}</Table.Td>
                  <Table.Td>{client.email || '-'}</Table.Td>
                  <Table.Td>{client.addressFull || '-'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        client.clientType === ClientType.INDIVIDUAL ? 'blue' : 'green'
                      }
                      variant="light"
                    >
                      {client.clientType === ClientType.INDIVIDUAL
                        ? 'Физ. лицо'
                        : 'Юр. лицо'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {client.firstPurchaseDate
                      ? formatDate(client.firstPurchaseDate)
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Просмотр">
                        <ActionIcon
                          variant="subtle"
                          color="greenCycle"
                          onClick={() => {
                            setSelectedClient(client);
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
                          onClick={() => handleOpenEdit(client.id)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => deleteMutation.mutate(client.id)}
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

        <MantineModal
          opened={opened}
          onClose={() => {
            setOpened(false);
            setEditingClient(null);
            form.reset();
          }}
          title={editingClient ? 'Редактировать клиента' : 'Создать клиента'}
          centered
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="ФИО"
                required
                {...form.getInputProps('fullName')}
              />
              <TextInput
                label="Телефон"
                {...form.getInputProps('phone')}
              />
              <TextInput
                label="Email"
                type="email"
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Адрес"
                {...form.getInputProps('addressFull')}
              />
              <Select
                label="Тип клиента"
                data={[
                  { value: ClientType.INDIVIDUAL, label: 'Физ. лицо' },
                  { value: ClientType.LEGAL_ENTITY, label: 'Юр. лицо' },
                ]}
                {...form.getInputProps('clientType')}
              />

              {form.values.clientType === ClientType.LEGAL_ENTITY && (
                <>
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
                </>
              )}

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setOpened(false);
                    setEditingClient(null);
                    form.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingClient ? 'Сохранить' : 'Создать'}
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setSelectedClient(null);
          }}
          title={`Клиент #${selectedClient?.id}`}
          centered
          size="xl"
        >
          {selectedClient && (
            <Stack gap="md">
              <Group>
                <Text fw={600}>ФИО:</Text>
                <Text>{selectedClient.fullName}</Text>
              </Group>
              {selectedClient.phone && (
                <Group>
                  <Text fw={600}>Телефон:</Text>
                  <Text>{selectedClient.phone}</Text>
                </Group>
              )}
              {selectedClient.email && (
                <Group>
                  <Text fw={600}>Email:</Text>
                  <Text>{selectedClient.email}</Text>
                </Group>
              )}
              {selectedClient.addressFull && (
                <Group>
                  <Text fw={600}>Адрес:</Text>
                  <Text>{selectedClient.addressFull}</Text>
                </Group>
              )}
              <Group>
                <Text fw={600}>Тип клиента:</Text>
                <Badge
                  color={
                    selectedClient.clientType === ClientType.INDIVIDUAL ? 'blue' : 'green'
                  }
                  variant="light"
                >
                  {selectedClient.clientType === ClientType.INDIVIDUAL
                    ? 'Физ. лицо'
                    : 'Юр. лицо'}
                </Badge>
              </Group>
              {selectedClient.firstPurchaseDate && (
                <Group>
                  <Text fw={600}>Первая покупка:</Text>
                  <Text>{formatDate(selectedClient.firstPurchaseDate)}</Text>
                </Group>
              )}

              {selectedClient.clientType === ClientType.LEGAL_ENTITY && (
                <>
                  <Divider label="Данные юридического лица" labelPosition="left" />
                  {selectedClient.legalEntityName && (
                    <Group>
                      <Text fw={600}>Название юридического лица:</Text>
                      <Text>{selectedClient.legalEntityName}</Text>
                    </Group>
                  )}
                  {selectedClient.inn && (
                    <Group>
                      <Text fw={600}>ИНН:</Text>
                      <Text>{selectedClient.inn}</Text>
                    </Group>
                  )}
                  {selectedClient.kpp && (
                    <Group>
                      <Text fw={600}>КПП:</Text>
                      <Text>{selectedClient.kpp}</Text>
                    </Group>
                  )}
                  {selectedClient.ogrn && (
                    <Group>
                      <Text fw={600}>ОГРН:</Text>
                      <Text>{selectedClient.ogrn}</Text>
                    </Group>
                  )}

                  {(selectedClient.bankName ||
                    selectedClient.bankAccount ||
                    selectedClient.correspondentAccount ||
                    selectedClient.bik) && (
                    <>
                      <Divider label="Банковские реквизиты" labelPosition="left" />
                      {selectedClient.bankName && (
                        <Group>
                          <Text fw={600}>Название банка:</Text>
                          <Text>{selectedClient.bankName}</Text>
                        </Group>
                      )}
                      {selectedClient.bankAccount && (
                        <Group>
                          <Text fw={600}>Расчетный счет:</Text>
                          <Text>{selectedClient.bankAccount}</Text>
                        </Group>
                      )}
                      {selectedClient.correspondentAccount && (
                        <Group>
                          <Text fw={600}>Корреспондентский счет:</Text>
                          <Text>{selectedClient.correspondentAccount}</Text>
                        </Group>
                      )}
                      {selectedClient.bik && (
                        <Group>
                          <Text fw={600}>БИК:</Text>
                          <Text>{selectedClient.bik}</Text>
                        </Group>
                      )}
                    </>
                  )}
                </>
              )}
            </Stack>
          )}
        </MantineModal>

        <MantineModal
          opened={bulkDeleteModalOpened}
          onClose={() => setBulkDeleteModalOpened(false)}
          title="Подтверждение удаления"
          centered
        >
          <Stack>
            <Text>
              Вы уверены, что хотите удалить {selectedIds.size} клиент
              {selectedIds.size > 1 && selectedIds.size < 5 ? 'ов' : selectedIds.size >= 5 ? 'ов' : ''}?
            </Text>
            <Text size="sm" c="dimmed">
              Это действие нельзя отменить. Клиенты с активными продажами или выкупами не будут удалены.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => setBulkDeleteModalOpened(false)}
              >
                Отмена
              </Button>
              <Button
                color="red"
                loading={bulkDeleteMutation.isPending}
                onClick={() => {
                  bulkDeleteMutation.mutate(Array.from(selectedIds));
                }}
              >
                Удалить
              </Button>
            </Group>
          </Stack>
        </MantineModal>

        <MantineModal
          opened={importModalOpened}
          onClose={() => {
            setImportModalOpened(false);
            setImportFile(null);
          }}
          title="Импорт клиентов из Excel"
          centered
          size="lg"
        >
          <Stack>
            {importFile && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                <Text size="sm">
                  Выбран файл: <strong>{importFile.name}</strong>
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Размер: {(importFile.size / 1024).toFixed(2)} KB
                </Text>
              </Alert>
            )}

            <Alert icon={<IconAlertCircle size={16} />} color="yellow">
              <Text size="sm" fw={600} mb="xs">
                Формат файла Excel:
              </Text>
              <Text size="xs">
                Обязательные колонки: <strong>ФИО</strong> (или "ФИО клиента", "Имя")
              </Text>
              <Text size="xs" mt="xs">
                Опциональные колонки: Телефон, Email, Адрес, Тип клиента, ИНН, КПП, ОГРН,
                Банк, Расчетный счет, Корреспондентский счет, БИК
              </Text>
            </Alert>

            {importMutation.data && importMutation.data.failed.length > 0 && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                <Text size="sm" fw={600} mb="xs">
                  Ошибки импорта ({importMutation.data.failed.length}):
                </Text>
                <Stack gap="xs">
                  {importMutation.data.failed.slice(0, 10).map((item, idx) => (
                    <Text key={idx} size="xs">
                      Строка {item.row}: {item.error}
                    </Text>
                  ))}
                  {importMutation.data.failed.length > 10 && (
                    <Text size="xs" c="dimmed">
                      ... и еще {importMutation.data.failed.length - 10} ошибок
                    </Text>
                  )}
                </Stack>
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setImportModalOpened(false);
                  setImportFile(null);
                }}
              >
                Отмена
              </Button>
              <Button
                leftSection={<IconUpload size={16} />}
                loading={importMutation.isPending}
                disabled={!importFile}
                onClick={() => {
                  if (importFile) {
                    importMutation.mutate(importFile);
                  }
                }}
              >
                Импортировать
              </Button>
            </Group>
          </Stack>
        </MantineModal>
      </Stack>
    </Container>
  );
}
