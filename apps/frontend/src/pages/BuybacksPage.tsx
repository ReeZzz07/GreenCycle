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
  Tabs,
  Select,
  TextInput,
  NumberInput,
  Textarea,
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconCheck,
  IconX,
  IconFileDownload,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { buybacksService } from '../services/buybacks.service';
import { salesService } from '../services/sales.service';
import { clientsService } from '../services/clients.service';
import {
  Buyback,
  BuybackStatus,
  CreateBuybackDto,
  CreateBuybackItemDto,
  UpdateBuybackDto,
} from '../types/buybacks';
import { formatDate, formatCurrency } from '../utils/format';
import { downloadPdf } from '../utils/pdf';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
import { useAuthContext } from '../contexts/AuthContext';

export function BuybacksPage() {
  const [opened, setOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedBuyback, setSelectedBuyback] = useState<Buyback | null>(null);
  const [buybackToEdit, setBuybackToEdit] = useState<Buyback | null>(null);
  const [statusFilter, setStatusFilter] = useState<BuybackStatus | 'all'>('all');
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'buybacks-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isAdmin = user?.role.name === 'admin' || user?.role.name === 'super_admin';

  const { data: buybacks, isLoading } = useQuery({
    queryKey: ['buybacks', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      buybacksService.getAll(
        statusFilter === 'all' ? undefined : (statusFilter as BuybackStatus),
      ),
  });
  const tableRef = useTableCardLabels(viewMode, [buybacks]);

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.getAll(),
    enabled: opened,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getAll(),
    enabled: opened,
  });

  const { data: buybackDetails, isFetching: isLoadingDetails } = useQuery({
    queryKey: ['buyback', selectedBuyback?.id],
    queryFn: () => buybacksService.getById(selectedBuyback!.id),
    enabled: viewModalOpened && !!selectedBuyback,
  });

  const form = useForm<CreateBuybackDto>({
    initialValues: {
      originalSaleId: 0,
      clientId: 0,
      plannedDate: '',
      actualDate: undefined,
      status: BuybackStatus.PLANNED,
      notes: '',
      items: [] as CreateBuybackItemDto[],
    },
    validate: {
      originalSaleId: (value) => (value > 0 ? null : 'Выберите продажу'),
      clientId: (value) => (value > 0 ? null : 'Выберите клиента'),
      plannedDate: (value) => (value ? null : 'Укажите планируемую дату'),
      items: (value) => (value.length > 0 ? null : 'Добавьте хотя бы один товар'),
    },
  });

  const editForm = useForm<{
    plannedDate: string;
    actualDate: string;
    status: BuybackStatus;
    notes: string;
  }>({
    initialValues: {
      plannedDate: '',
      actualDate: '',
      status: BuybackStatus.PLANNED,
      notes: '',
    },
    validate: {
      plannedDate: (value) => (value ? null : 'Укажите планируемую дату'),
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateBuybackDto) => buybacksService.create(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Выкуп создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['buybacks'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать выкуп',
        color: 'red',
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, actualDate }: { id: number; actualDate?: string }) =>
      buybacksService.complete(id, actualDate),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Выкуп завершён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['buybacks'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось завершить выкуп',
        color: 'red',
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: number) => buybacksService.decline(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Выкуп отклонён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['buybacks'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось отклонить выкуп',
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateBuybackDto }) =>
      buybacksService.update(id, dto),
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Успешно',
        message: 'Выкуп обновлён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['buybacks'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['buyback', variables.id] });
      }
      setEditModalOpened(false);
      setBuybackToEdit(null);
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось обновить выкуп',
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => buybacksService.delete(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Выкуп удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['buybacks'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить выкуп',
        color: 'red',
      });
    },
  });

  const handleSaleChange = (saleId: number) => {
    const sale = sales?.find((s) => s.id === saleId);
    if (sale) {
      form.setFieldValue('clientId', sale.clientId);
      form.setFieldValue('items', []);
    }
  };

  const addItem = () => {
    form.insertListItem('items', {
      originalSaleItemId: 0,
      quantity: 1,
      buybackPricePerUnit: 0,
      conditionNotes: '',
    });
  };

  const removeItem = (index: number) => {
    form.removeListItem('items', index);
  };

  const handleSubmit = (values: CreateBuybackDto) => {
    createMutation.mutate(values);
  };

  const getStatusColor = (status: BuybackStatus) => {
    switch (status) {
      case BuybackStatus.PLANNED:
        return 'blue';
      case BuybackStatus.CONTACTED:
        return 'yellow';
      case BuybackStatus.COMPLETED:
        return 'green';
      case BuybackStatus.DECLINED:
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: BuybackStatus) => {
    switch (status) {
      case BuybackStatus.PLANNED:
        return 'Запланирован';
      case BuybackStatus.CONTACTED:
        return 'Связались';
      case BuybackStatus.COMPLETED:
        return 'Завершён';
      case BuybackStatus.DECLINED:
        return 'Отклонён';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  const saleOptions =
    sales?.map((sale) => ({
      value: sale.id.toString(),
      label: `Продажа #${sale.id} - ${sale.client.fullName} (${formatDate(sale.saleDate)})`,
    })) || [];

  const clientOptions =
    clients?.map((client) => ({
      value: client.id.toString(),
      label: client.fullName,
    })) || [];

  const selectedSale = sales?.find((s) => s.id === form.values.originalSaleId);
  const saleItemOptions =
    selectedSale?.items.map((item) => ({
      value: item.id.toString(),
      label: `${item.batch.plantType} (${item.batch.sizeCmMin}-${item.batch.sizeCmMax}см) - ${item.quantity} шт`,
    })) || [];

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Выкуп
            </Title>
            <Text c="dimmed">Управление выкупами и контроль сроков</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setOpened(true)}>
            Создать выкуп
          </Button>
        </Group>

        <Tabs
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as BuybackStatus | 'all')}
        >
          <Tabs.List>
            <Tabs.Tab value="all">Все</Tabs.Tab>
            <Tabs.Tab value={BuybackStatus.PLANNED}>Запланированные</Tabs.Tab>
            <Tabs.Tab value={BuybackStatus.CONTACTED}>Связались</Tabs.Tab>
            <Tabs.Tab value={BuybackStatus.COMPLETED}>Завершённые</Tabs.Tab>
            <Tabs.Tab value={BuybackStatus.DECLINED}>Отклонённые</Tabs.Tab>
          </Tabs.List>
        </Tabs>

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
                <Table.Th>Планируемая дата</Table.Th>
                <Table.Th>Фактическая дата</Table.Th>
                <Table.Th>Количество товаров</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {buybacks?.map((buyback) => (
                <Table.Tr key={buyback.id}>
                  <Table.Td>#{buyback.id}</Table.Td>
                  <Table.Td>{buyback.client.fullName}</Table.Td>
                  <Table.Td>{formatDate(buyback.plannedDate)}</Table.Td>
                  <Table.Td>
                    {buyback.actualDate ? formatDate(buyback.actualDate) : '-'}
                  </Table.Td>
                  <Table.Td>{buyback.items.length}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(buyback.status)} variant="light">
                      {getStatusLabel(buyback.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Просмотр">
                        <ActionIcon
                          variant="subtle"
                          color="greenCycle"
                          onClick={() => {
                            setSelectedBuyback(buyback);
                            setViewModalOpened(true);
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Редактировать">
                        <ActionIcon
                          variant="subtle"
                          color="yellow"
                          onClick={() => {
                            setBuybackToEdit(buyback);
                            editForm.setValues({
                              plannedDate: buyback.plannedDate,
                              actualDate: buyback.actualDate ?? '',
                              status: buyback.status,
                              notes: buyback.notes ?? '',
                            });
                            setEditModalOpened(true);
                          }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {buyback.status === BuybackStatus.COMPLETED && (
                        <Tooltip label="Скачать акт">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={async () => {
                              try {
                                await downloadPdf(
                                  `/buybacks/${buyback.id}/act`,
                                  `buyback-act-${buyback.id}.pdf`,
                                );
                                notifications.show({
                                  title: 'Успешно',
                                  message: 'Акт скачан',
                                  color: 'green',
                                });
                              } catch (error) {
                                notifications.show({
                                  title: 'Ошибка',
                                  message: 'Не удалось скачать акт',
                                  color: 'red',
                                });
                              }
                            }}
                          >
                            <IconFileDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {buyback.status !== BuybackStatus.COMPLETED &&
                        buyback.status !== BuybackStatus.DECLINED && (
                          <>
                            <Tooltip label="Завершить">
                              <ActionIcon
                                variant="subtle"
                                color="green"
                                onClick={() => completeMutation.mutate({ id: buyback.id })}
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Отклонить">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => declineMutation.mutate(buyback.id)}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      {buyback.status === BuybackStatus.DECLINED && isAdmin && (
                        <Tooltip label="Удалить">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Вы уверены, что хотите удалить этот отменённый выкуп?',
                                )
                              ) {
                                deleteMutation.mutate(buyback.id);
                              }
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
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
          title="Создать выкуп"
          centered
          size="xl"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Select
                label="Продажа"
                required
                data={saleOptions}
                searchable
                placeholder="Выберите продажу"
                value={form.values.originalSaleId.toString()}
                onChange={(value) => {
                  const saleId = value ? parseInt(value) : 0;
                  form.setFieldValue('originalSaleId', saleId);
                  handleSaleChange(saleId);
                }}
                error={form.errors.originalSaleId}
              />
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
              />
              <TextInput
                label="Планируемая дата"
                type="date"
                required
                {...form.getInputProps('plannedDate')}
              />
              <TextInput
                label="Фактическая дата (опционально)"
                type="date"
                {...form.getInputProps('actualDate')}
              />
              <Select
                label="Статус"
                data={[
                  { value: BuybackStatus.PLANNED, label: 'Запланирован' },
                  { value: BuybackStatus.CONTACTED, label: 'Связались' },
                ]}
                value={form.values.status}
                onChange={(value) =>
                  form.setFieldValue('status', value as BuybackStatus)
                }
              />
              <Textarea
                label="Заметки"
                rows={3}
                {...form.getInputProps('notes')}
              />

              <Group justify="space-between" mt="md">
                <Text fw={500}>Товары</Text>
                <Button size="xs" onClick={addItem} disabled={!selectedSale}>
                  Добавить товар
                </Button>
              </Group>

              {form.values.items.map((item, index) => (
                <Paper key={index} withBorder p="md">
                  <Group>
                    <Select
                      label="Товар из продажи"
                      required
                      data={saleItemOptions}
                      searchable
                      placeholder="Выберите товар"
                      value={item.originalSaleItemId.toString()}
                      onChange={(value) =>
                        form.setFieldValue(
                          `items.${index}.originalSaleItemId`,
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
                      label="Цена выкупа за единицу"
                      required
                      min={0}
                      decimalScale={2}
                      {...form.getInputProps(`items.${index}.buybackPricePerUnit`)}
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
                  <Textarea
                    label="Заметки о состоянии"
                    rows={2}
                    mt="sm"
                    {...form.getInputProps(`items.${index}.conditionNotes`)}
                  />
                </Paper>
              ))}

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
          opened={viewModalOpened}
          onClose={() => {
            setViewModalOpened(false);
            setSelectedBuyback(null);
          }}
          title={`Выкуп #${selectedBuyback?.id ?? ''}`}
          centered
          size="xl"
        >
          {isLoadingDetails || !buybackDetails ? (
            <LoadingSpinner fullHeight={false} />
          ) : (
            <Stack gap="md">
              <Paper withBorder p="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Text size="sm" c="dimmed">
                      Клиент
                    </Text>
                    <Text fw={600}>{buybackDetails.client.fullName}</Text>
                    <Text size="xs" c="dimmed">
                      Продажа #{buybackDetails.originalSale.id} от{' '}
                      {formatDate(buybackDetails.originalSale.saleDate)}
                    </Text>
                  </Stack>
                  <Stack gap={4} ta="right">
                    <Text size="sm" c="dimmed">
                      Статус
                    </Text>
                    <Badge color={getStatusColor(buybackDetails.status)} variant="light">
                      {getStatusLabel(buybackDetails.status)}
                    </Badge>
                  </Stack>
                </Group>
                <Table mt="md">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>Планируемая дата</Table.Td>
                      <Table.Td>{formatDate(buybackDetails.plannedDate)}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Фактическая дата</Table.Td>
                      <Table.Td>
                        {buybackDetails.actualDate
                          ? formatDate(buybackDetails.actualDate)
                          : '—'}
                      </Table.Td>
                    </Table.Tr>
                    {buybackDetails.notes && (
                      <Table.Tr>
                        <Table.Td>Заметки</Table.Td>
                        <Table.Td>{buybackDetails.notes}</Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>

              <Paper withBorder p="md">
                <Title order={5} mb="xs">
                  Товары
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Растение</Table.Th>
                      <Table.Th>Количество</Table.Th>
                      <Table.Th>Цена выкупа</Table.Th>
                      <Table.Th>Сумма</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {buybackDetails.items.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>{item.originalSaleItem.batch.plantType}</Table.Td>
                        <Table.Td>{item.quantity}</Table.Td>
                        <Table.Td>{formatCurrency(item.buybackPricePerUnit)}</Table.Td>
                        <Table.Td>
                          {formatCurrency(
                            (Number(item.buybackPricePerUnit) || 0) * item.quantity,
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          )}
        </MantineModal>

        <MantineModal
          opened={editModalOpened}
          onClose={() => {
            setEditModalOpened(false);
            setBuybackToEdit(null);
            editForm.reset();
          }}
          title={`Редактировать выкуп #${buybackToEdit?.id ?? ''}`}
          centered
          size="lg"
        >
          <form
            onSubmit={editForm.onSubmit((values) => {
              if (!buybackToEdit) {
                return;
              }
              updateMutation.mutate({
                id: buybackToEdit.id,
                dto: {
                  plannedDate: values.plannedDate,
                  actualDate: values.actualDate || undefined,
                  status: values.status,
                  notes: values.notes?.trim() || undefined,
                },
              });
            })}
          >
            <Stack>
              <TextInput
                label="Планируемая дата"
                type="date"
                required
                {...editForm.getInputProps('plannedDate')}
              />
              <TextInput
                label="Фактическая дата"
                type="date"
                {...editForm.getInputProps('actualDate')}
              />
              <Select
                label="Статус"
                data={[
                  { value: BuybackStatus.PLANNED, label: 'Запланирован' },
                  { value: BuybackStatus.CONTACTED, label: 'Связались' },
                  { value: BuybackStatus.COMPLETED, label: 'Завершён' },
                  { value: BuybackStatus.DECLINED, label: 'Отклонён' },
                ]}
                value={editForm.values.status}
                onChange={(value) =>
                  editForm.setFieldValue('status', (value as BuybackStatus) || BuybackStatus.PLANNED)
                }
              />
              <Textarea
                label="Заметки"
                rows={3}
                {...editForm.getInputProps('notes')}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setEditModalOpened(false);
                    setBuybackToEdit(null);
                    editForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={updateMutation.isPending}>
                  Сохранить
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>
      </Stack>
    </Container>
  );
}