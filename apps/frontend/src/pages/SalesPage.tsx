import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Group,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Modal as MantineModal,
  Select,
  NumberInput,
  TextInput,
  Alert,
} from '@mantine/core';
import { IconPlus, IconEye, IconX, IconFileDownload, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { salesService } from '../services/sales.service';
import { clientsService } from '../services/clients.service';
import { inventoryService } from '../services/inventory.service';
import { financeService } from '../services/finance.service';
import { CreateSaleDto, CreateSaleItemDto, Sale } from '../types/sales';
import { CreateClientDto, ClientType } from '../types/clients';
import { formatCurrency, formatDate } from '../utils/format';
import { downloadPdf } from '../utils/pdf';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';

export function SalesPage() {
  const [opened, setOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [clientModalOpened, setClientModalOpened] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'sales-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.getAll(),
  });
  const tableRef = useTableCardLabels(viewMode, [sales]);

  // Загрузка детальной информации о продаже с транзакцией
  const { data: saleDetails } = useQuery({
    queryKey: ['sale', selectedSale?.id],
    queryFn: () => salesService.getById(selectedSale!.id),
    enabled: !!selectedSale && viewModalOpened,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getAll(),
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getSummary(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => financeService.getAllAccounts(),
  });

  const form = useForm<CreateSaleDto>({
    initialValues: {
      clientId: 0,
      saleDate: new Date().toISOString().split('T')[0],
      items: [] as CreateSaleItemDto[],
      accountId: undefined,
    },
    validate: {
      clientId: (value) => (value > 0 ? null : 'Выберите клиента'),
      saleDate: (value) => (value ? null : 'Укажите дату продажи'),
      items: (value) => (value.length > 0 ? null : 'Добавьте хотя бы один товар'),
      accountId: (value) => (value && value > 0 ? null : 'Выберите счёт для поступления средств'),
    },
  });

  const clientForm = useForm<CreateClientDto>({
    initialValues: {
      fullName: '',
      phone: '',
      email: '',
      addressFull: '',
      clientType: ClientType.INDIVIDUAL,
    },
    validate: {
      fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО клиента'),
      email: (value) =>
        value && value.length > 0 && !/^\S+@\S+$/.test(value) ? 'Некорректный email' : null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSaleDto) => salesService.create(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Продажа создана',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать продажу',
        color: 'red',
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (dto: CreateClientDto) => clientsService.create(dto),
    onSuccess: (newClient) => {
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) {
          return [newClient];
        }
        if (Array.isArray(oldData)) {
          return [...oldData, newClient];
        }
        return oldData;
      });
      notifications.show({
        title: 'Успешно',
        message: 'Клиент создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientModalOpened(false);
      clientForm.reset();
      form.setFieldValue('clientId', newClient.id);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать клиента',
        color: 'red',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesService.cancel(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Продажа отменена',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось отменить продажу',
        color: 'red',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'completed' | 'cancelled' }) =>
      salesService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Успешно',
        message:
          variables.status === 'completed'
            ? 'Продажа помечена как завершенная'
            : 'Продажа отменена',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // Обновляем selectedSale если он открыт
      if (selectedSale?.id === variables.id) {
        setSelectedSale((prev) =>
          prev ? { ...prev, status: variables.status } : null,
        );
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось изменить статус продажи';
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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

  const deleteSaleMutation = useMutation({
    mutationFn: (id: number) => salesService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Продажа и связанные транзакции удалены',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', selectedSale?.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setViewModalOpened(false);
      setSelectedSale(null);
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось удалить продажу';
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

  const addItem = () => {
    form.insertListItem('items', {
      batchId: 0,
      quantity: 1,
      salePricePerUnit: 0,
    });
  };

  const removeItem = (index: number) => {
    form.removeListItem('items', index);
  };

  const handleSubmit = (values: CreateSaleDto) => {
    createMutation.mutate(values);
  };

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  const availableBatches =
    inventory?.filter((item) => item.quantityCurrent > 0) || [];

  const clientOptions =
    clients?.map((client) => ({
      value: client.id.toString(),
      label: client.fullName,
    })) || [];

  const batchOptions = availableBatches.map((item) => ({
    value: item.batchId.toString(),
    label: `${item.plantType} (${item.sizeCmMin}-${item.sizeCmMax}см, ${item.potType}) - ${item.quantityCurrent} шт`,
  }));

  const accountOptions =
    accounts?.map((account) => ({
      value: account.id.toString(),
      label: `${account.name} (${account.type === 'cash' ? 'Наличные' : account.type === 'bank' ? 'Банк' : 'Прочее'})`,
    })) || [];

  const totalAmount = form.values.items.reduce((sum, item) => {
    return sum + item.quantity * item.salePricePerUnit;
  }, 0);

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Продажи
            </Title>
            <Text c="dimmed">Оформление продаж и история</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setOpened(true)}>
            Создать продажу
          </Button>
        </Group>

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
                <Table.Th>Клиент</Table.Th>
                <Table.Th>Дата продажи</Table.Th>
                <Table.Th>Количество товаров</Table.Th>
                <Table.Th>Сумма</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sales?.map((sale) => (
                <Table.Tr key={sale.id}>
                  <Table.Td>#{sale.id}</Table.Td>
                  <Table.Td>{sale.client.fullName}</Table.Td>
                  <Table.Td>{formatDate(sale.saleDate)}</Table.Td>
                  <Table.Td>{sale.items.length}</Table.Td>
                  <Table.Td>{formatCurrency(sale.totalAmount)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={sale.status === 'completed' ? 'green' : 'red'}
                      variant="light"
                    >
                      {sale.status === 'completed' ? 'Завершена' : 'Отменена'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Просмотр">
                        <ActionIcon
                          variant="subtle"
                          color="greenCycle"
                          onClick={() => {
                            setSelectedSale(sale);
                            setViewModalOpened(true);
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {sale.status === 'completed' && (
                        <>
                          <Tooltip label="Скачать счёт">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={async () => {
                                try {
                                  await downloadPdf(
                                    `/sales/${sale.id}/invoice`,
                                    `invoice-${sale.id}.pdf`,
                                  );
                                  notifications.show({
                                    title: 'Успешно',
                                    message: 'Счёт скачан',
                                    color: 'green',
                                  });
                                } catch (error) {
                                  notifications.show({
                                    title: 'Ошибка',
                                    message: 'Не удалось скачать счёт',
                                    color: 'red',
                                  });
                                }
                              }}
                            >
                              <IconFileDownload size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Отменить">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => cancelMutation.mutate(sale.id)}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
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
            form.reset();
          }}
          title="Создать продажу"
          centered
          size="xl"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Stack gap={4}>
                <Group align="flex-end" gap="xs">
                  <Select
                    label="Клиент"
                    required
                    data={clientOptions}
                    searchable
                    placeholder="Выберите клиента"
                    value={form.values.clientId.toString()}
                    onChange={(value) =>
                      form.setFieldValue('clientId', value ? parseInt(value) : 0)
                    }
                    error={form.errors.clientId}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => setClientModalOpened(true)}
                    style={{ marginBottom: '4px' }}
                  >
                    <IconPlus size={16} />
                  </Button>
                </Group>
                <Text size="xs" c="dimmed">
                  Если клиента ещё нет в системе, добавьте его через кнопку «+». Подробные данные
                  можно заполнить позже в разделе «Клиенты».
                </Text>
              </Stack>
              <TextInput
                label="Дата продажи"
                type="date"
                required
                {...form.getInputProps('saleDate')}
              />
              <Select
                label="Счёт для поступления средств"
                required
                data={accountOptions}
                searchable
                placeholder="Выберите счёт"
                value={form.values.accountId?.toString() || ''}
                onChange={(value) =>
                  form.setFieldValue('accountId', value ? parseInt(value) : undefined)
                }
                error={form.errors.accountId}
                description="Выберите счёт, на который поступят средства от продажи"
              />

              <Group justify="space-between" mt="md">
                <Text fw={500}>Товары</Text>
                <Button size="xs" onClick={addItem}>
                  Добавить товар
                </Button>
              </Group>

              {form.values.items.map((item, index) => (
                <Paper key={index} withBorder p="md">
                  <Group>
                    <Select
                      label="Партия"
                      required
                      data={batchOptions}
                      searchable
                      placeholder="Выберите партию"
                      value={item.batchId.toString()}
                      onChange={(value) =>
                        form.setFieldValue(
                          `items.${index}.batchId`,
                          value ? parseInt(value) : 0,
                        )
                      }
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Количество"
                      required
                      min={1}
                      {...form.getInputProps(`items.${index}.quantity`)}
                      style={{ width: 120 }}
                    />
                    <NumberInput
                      label="Цена за единицу"
                      required
                      min={0}
                      decimalScale={2}
                      {...form.getInputProps(`items.${index}.salePricePerUnit`)}
                      style={{ width: 150 }}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeItem(index)}
                      mt="xl"
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}

              <Paper withBorder p="md" mt="md">
                <Group justify="space-between">
                  <Text fw={500}>Итого:</Text>
                  <Text fw={700} size="lg">
                    {formatCurrency(totalAmount)}
                  </Text>
                </Group>
              </Paper>

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setOpened(false);
                    form.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={clientModalOpened}
          onClose={() => {
            setClientModalOpened(false);
            clientForm.reset();
          }}
          title="Создать клиента"
          centered
        >
          <form
            onSubmit={clientForm.onSubmit((values) => {
              // Преобразуем пустые строки в undefined для опциональных полей
              const cleanValues: CreateClientDto = {
                fullName: values.fullName.trim(),
                addressFull: values.addressFull?.trim() || undefined,
                phone: values.phone?.trim() || undefined,
                email: values.email?.trim() || undefined,
                clientType: values.clientType || ClientType.INDIVIDUAL,
              };
              createClientMutation.mutate(cleanValues);
            })}
          >
            <Stack>
              <TextInput
                label="ФИО клиента"
                required
                placeholder="Введите ФИО"
                {...clientForm.getInputProps('fullName')}
              />
              <TextInput
                label="Телефон"
                placeholder="+7 (999) 123-45-67"
                {...clientForm.getInputProps('phone')}
              />
              <TextInput
                label="Email"
                placeholder="client@example.com"
                {...clientForm.getInputProps('email')}
              />
              <TextInput
                label="Адрес"
                placeholder="Город, улица, дом (можно указать позже)"
                {...clientForm.getInputProps('addressFull')}
              />
              <Alert
                variant="light"
                color="blue"
                title="Дополнительная информация"
                styles={{
                  root: {
                    backgroundColor: 'var(--mantine-color-blue-0)',
                  },
                }}
              >
                <Text size="sm">
                  После создания клиента вы сможете указать юридические и банковские данные в
                  разделе{' '}
                  <Text component="span" fw={600}>
                    «Клиенты»
                  </Text>
                  .
                </Text>
              </Alert>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setClientModalOpened(false);
                    clientForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createClientMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setSelectedSale(null);
          }}
          title={`Продажа #${selectedSale?.id || saleDetails?.id || ''}`}
          centered
          size="xl"
        >
          {(saleDetails || selectedSale) && (
            <Stack gap="md">
              {(() => {
                const sale = saleDetails || selectedSale!;
                const getTransactionTypeLabel = (type: string) => {
                  switch (type) {
                    case 'purchase':
                      return 'Закупка';
                    case 'sale':
                      return 'Продажа';
                    case 'buyback':
                      return 'Выкуп';
                    case 'write_off':
                      return 'Списание';
                    case 'partner_withdrawal':
                      return 'Изъятие партнёра';
                    default:
                      return type;
                  }
                };

                const getAccountTypeLabel = (type: string) => {
                  switch (type) {
                    case 'cash':
                      return 'Наличные';
                    case 'bank':
                      return 'Банк';
                    case 'other':
                      return 'Прочее';
                    default:
                      return type;
                  }
                };

                return (
                  <>
                    <Group>
                      <Text fw={600}>Клиент:</Text>
                      <Text>{sale.client.fullName}</Text>
                    </Group>
                    <Group>
                      <Text fw={600}>Дата продажи:</Text>
                      <Text>{formatDate(sale.saleDate)}</Text>
                    </Group>
                    <Group>
                      <Text fw={600}>Статус:</Text>
                      <Badge
                        color={sale.status === 'completed' ? 'green' : 'red'}
                        variant="light"
                      >
                        {sale.status === 'completed' ? 'Завершена' : 'Отменена'}
                      </Badge>
                    </Group>
                    <Group>
                      <Text fw={600}>Общая сумма:</Text>
                      <Text fw={700} size="lg">
                        {formatCurrency(sale.totalAmount)}
                      </Text>
                    </Group>

                    <div>
                      <Text fw={600} mb="xs">
                        Товары ({sale.items.length}):
                      </Text>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Партия</Table.Th>
                            <Table.Th>Количество</Table.Th>
                            <Table.Th>Цена за единицу</Table.Th>
                            <Table.Th>Сумма</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {sale.items.map((item) => (
                            <Table.Tr key={item.id}>
                              <Table.Td>
                                {item.batch.plantType} ({item.batch.sizeCmMin}-{item.batch.sizeCmMax}
                                см, {item.batch.potType})
                              </Table.Td>
                              <Table.Td>{item.quantity}</Table.Td>
                              <Table.Td>{formatCurrency(item.salePricePerUnit)}</Table.Td>
                              <Table.Td>
                                {formatCurrency(
                                  (item.quantity * Number(item.salePricePerUnit)).toString(),
                                )}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </div>

                    {/* Информация о связанной транзакции */}
                    {sale.transaction && (
                      <div>
                        <Text fw={600} mb="xs">
                          Финансовая транзакция:
                        </Text>
                        <Table>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID</Table.Th>
                              <Table.Th>Счёт</Table.Th>
                              <Table.Th>Тип</Table.Th>
                              <Table.Th>Сумма</Table.Th>
                              <Table.Th>Статус</Table.Th>
                              <Table.Th>Дата</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td>#{sale.transaction.id}</Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <Text>{sale.transaction.account.name}</Text>
                                  <Badge variant="light" size="sm">
                                    {getAccountTypeLabel(sale.transaction.account.type)}
                                  </Badge>
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  variant="light"
                                  color={sale.transaction.isCancelled ? 'red' : undefined}
                                >
                                  {getTransactionTypeLabel(sale.transaction.type)}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text
                                  fw={700}
                                  c={Number(sale.transaction.amount) >= 0 ? 'green' : 'red'}
                                >
                                  {formatCurrency(sale.transaction.amount)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={sale.transaction.isCancelled ? 'red' : 'green'}
                                  variant="light"
                                >
                                  {sale.transaction.isCancelled ? 'Отменена' : 'Активна'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>{formatDate(sale.transaction.createdAt)}</Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>
                        {sale.transaction.description && (
                          <Text c="dimmed" size="sm" mt="xs">
                            Описание: {sale.transaction.description}
                          </Text>
                        )}
                      </div>
                    )}

                    {!sale.transaction && sale.status === 'completed' && (
                      <Text c="dimmed" size="sm" style={{ fontStyle: 'italic' }}>
                        Финансовая транзакция не найдена
                      </Text>
                    )}

                    <Group justify="space-between" mt="md">
                      <div>
                        <Text c="dimmed" size="sm">
                          Создано: {formatDate(sale.createdAt)}
                        </Text>
                        {sale.updatedAt !== sale.createdAt && (
                          <Text c="dimmed" size="sm">
                            Обновлено: {formatDate(sale.updatedAt)}
                          </Text>
                        )}
                      </div>
                      <Group gap="xs">
                        {sale.status === 'completed' ? (
                          <Button
                            color="red"
                            variant="light"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: sale.id,
                                status: 'cancelled',
                              })
                            }
                            loading={updateStatusMutation.isPending}
                          >
                            Отменить продажу
                          </Button>
                        ) : (
                          <>
                            <Button
                              color="green"
                              variant="light"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: sale.id,
                                  status: 'completed',
                                })
                              }
                              loading={updateStatusMutation.isPending}
                            >
                              Пометить как завершенную
                            </Button>
                            <Button
                              color="red"
                              variant="outline"
                              leftSection={<IconTrash size={16} />}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    sale.transaction
                                      ? 'Вы уверены, что хотите удалить эту продажу? Связанная транзакция будет удалена автоматически. Это действие нельзя отменить.'
                                      : 'Вы уверены, что хотите удалить эту продажу? Это действие нельзя отменить.',
                                  )
                                ) {
                                  deleteSaleMutation.mutate(sale.id);
                                }
                              }}
                              loading={deleteSaleMutation.isPending}
                            >
                              Удалить продажу
                            </Button>
                          </>
                        )}
                      </Group>
                    </Group>
                  </>
                );
              })()}
            </Stack>
          )}
        </MantineModal>
      </Stack>
    </Container>
  );
}
