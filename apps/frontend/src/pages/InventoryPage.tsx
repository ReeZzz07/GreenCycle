import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Badge,
  Group,
  Button,
  Modal as MantineModal,
  TextInput,
  NumberInput,
  Textarea,
  Select,
  ActionIcon,
  Tooltip,
  Divider,
} from '@mantine/core';
import { IconPlus, IconRefresh, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { inventoryService } from '../services/inventory.service';
import { CreateWriteOffDto, BatchDetails } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
import { useAuthContext } from '../contexts/AuthContext';

export function InventoryPage() {
  const { user } = useAuthContext();
  const isAdmin = user?.role.name === 'admin' || user?.role.name === 'super_admin';
  const [opened, setOpened] = useState(false);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'inventory-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getSummary(),
  });

  const { data: writeOffs } = useQuery({
    queryKey: ['writeOffs'],
    queryFn: () => inventoryService.getWriteOffs(),
  });

  const form = useForm<CreateWriteOffDto>({
    initialValues: {
      batchId: 0,
      quantity: 0,
      reason: '',
      writeOffDate: new Date().toISOString().split('T')[0],
      comment: '',
    },
    validate: {
      batchId: (value) => (value > 0 ? null : 'Выберите партию'),
      quantity: (value) => (value > 0 ? null : 'Количество должно быть больше 0'),
      reason: (value) => (value.trim().length > 0 ? null : 'Укажите причину списания'),
      writeOffDate: (value) => (value ? null : 'Укажите дату списания'),
    },
  });

  const createWriteOffMutation = useMutation({
    mutationFn: (dto: CreateWriteOffDto) => inventoryService.createWriteOff(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Списание создано',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['writeOffs'] });
      setOpened(false);
      form.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать списание',
        color: 'red',
      });
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => inventoryService.recalculateStock(),
    onSuccess: (result) => {
      notifications.show({
        title: 'Пересчет выполнен',
        message:
          result.updatedCount > 0
            ? `Обновлено партий: ${result.updatedCount}`
            : 'Все остатки уже были актуальны',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось пересчитать остатки',
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: CreateWriteOffDto) => {
    createWriteOffMutation.mutate(values);
  };

  const handleRecalculate = () => {
    if (
      window.confirm(
        'Пересчитать складские остатки на основе фактических продаж и списаний? Это действие обновит текущие количества.',
      )
    ) {
      recalculateMutation.mutate();
    }
  };

  const { data: batchDetails, isFetching: isLoadingDetails } = useQuery({
    queryKey: ['batchDetails', selectedBatchId],
    queryFn: () => inventoryService.getBatchDetails(selectedBatchId as number),
    enabled: detailsOpened && selectedBatchId !== null,
  });

  const openDetails = (batchId: number) => {
    setSelectedBatchId(batchId);
    setDetailsOpened(true);
  };

  const closeDetails = () => {
    setDetailsOpened(false);
    setSelectedBatchId(null);
  };

  const availableBatches = inventory?.filter((item) => item.quantityCurrent > 0) || [];
  const tableRef = useTableCardLabels(viewMode, [inventory]);

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Склад
            </Title>
            <Text c="dimmed">Остатки товаров на складе</Text>
          </div>
          <Group gap="sm">
            {isAdmin && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconRefresh size={16} />}
                onClick={handleRecalculate}
                loading={recalculateMutation.isPending}
              >
                Пересчитать остатки
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setOpened(true)}
              disabled={availableBatches.length === 0}
            >
              Создать списание
            </Button>
          </Group>
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
                <Table.Th>ID партии</Table.Th>
                <Table.Th>Тип растения</Table.Th>
                <Table.Th>Размер (см)</Table.Th>
                <Table.Th>Тип горшка</Table.Th>
                <Table.Th>Поставщик</Table.Th>
                <Table.Th>Дата поступления</Table.Th>
                <Table.Th>Начальное количество</Table.Th>
                <Table.Th>Текущее количество</Table.Th>
                <Table.Th>Цена за единицу</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {inventory?.map((item) => (
                <Table.Tr key={item.batchId}>
                  <Table.Td>#{item.batchId}</Table.Td>
                  <Table.Td>{item.plantType}</Table.Td>
                  <Table.Td>
                    {item.sizeCmMin}-{item.sizeCmMax}
                  </Table.Td>
                  <Table.Td>{item.potType}</Table.Td>
                  <Table.Td>{item.supplierName}</Table.Td>
                  <Table.Td>{formatDate(item.arrivalDate)}</Table.Td>
                  <Table.Td>{item.quantityInitial}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={item.quantityCurrent > 0 ? 'green' : 'red'}
                      variant="light"
                    >
                      {item.quantityCurrent}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatCurrency(item.purchasePricePerUnit)}</Table.Td>
                  <Table.Td>
                    <Tooltip label="Подробнее">
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={() => openDetails(item.batchId)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
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
          title="Создать списание"
          centered
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <Select
                label="Партия"
                required
                data={availableBatches.map((item) => ({
                  value: item.batchId.toString(),
                  label: `${item.plantType} (${item.sizeCmMin}-${item.sizeCmMax}см, ${item.potType}) - ${item.quantityCurrent} шт`,
                }))}
                searchable
                placeholder="Выберите партию"
                value={form.values.batchId.toString()}
                onChange={(value) =>
                  form.setFieldValue('batchId', value ? parseInt(value) : 0)
                }
                error={form.errors.batchId}
              />
              <NumberInput
                label="Количество"
                required
                min={1}
                max={
                  availableBatches.find(
                    (item) => item.batchId === form.values.batchId,
                  )?.quantityCurrent || 0
                }
                {...form.getInputProps('quantity')}
              />
              <TextInput
                label="Дата списания"
                type="date"
                required
                {...form.getInputProps('writeOffDate')}
              />
              <Textarea
                label="Причина списания"
                required
                rows={3}
                {...form.getInputProps('reason')}
              />
              <Textarea
                label="Комментарий"
                rows={2}
                {...form.getInputProps('comment')}
              />
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
                <Button type="submit" loading={createWriteOffMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={detailsOpened}
          onClose={closeDetails}
          title={`Информация о партии #${selectedBatchId ?? ''}`}
          centered
          size="xl"
        >
          {isLoadingDetails || !batchDetails ? (
            <LoadingSpinner fullHeight={false} />
          ) : (
            <Stack gap="md">
              <Paper withBorder p="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={4}>
                    <Title order={4}>{batchDetails.batch.plantType}</Title>
                    <Text size="sm" c="dimmed">
                      {batchDetails.batch.sizeCmMin}-{batchDetails.batch.sizeCmMax} см ·{' '}
                      {batchDetails.batch.potType}
                    </Text>
                  </Stack>
                  <Stack gap={4} ta="right">
                    <Text size="sm" c="dimmed">
                      Поставщик
                    </Text>
                    <Text fw={600}>{batchDetails.supplier.name}</Text>
                    <Text size="xs" c="dimmed">
                      Дата прибытия: {formatDate(batchDetails.shipment.arrivalDate)}
                    </Text>
                  </Stack>
                </Group>
                <Divider my="sm" />
                <Group justify="space-between" align="center">
                  <Text size="sm" component="div">
                    Начальное количество: <strong>{batchDetails.batch.quantityInitial}</strong>
                  </Text>
                  <Group gap="xs" align="center">
                    <Text size="sm" component="span">
                      Текущее количество:
                    </Text>
                    <Badge size="m" color="green" variant="light">
                      {batchDetails.stats.availableQuantity}
                    </Badge>
                  </Group>
                  <Text size="sm" component="div">
                    Цена закупки: {formatCurrency(batchDetails.batch.purchasePricePerUnit)}
                  </Text>
                </Group>
              </Paper>

              <Paper withBorder p="md">
                <Title order={5} mb="xs">
                  Статистика движения
                </Title>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>Продано</Table.Td>
                      <Table.Td>{batchDetails.stats.soldQuantity} шт</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Отменено</Table.Td>
                      <Table.Td>{batchDetails.stats.cancelledQuantity} шт</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>Списания</Table.Td>
                      <Table.Td>{batchDetails.stats.writeOffQuantity} шт</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Paper>

              <Stack>
                <Paper withBorder p="md">
                  <Title order={5} mb="xs">
                    Недавние продажи
                  </Title>
                  {batchDetails.recentSales.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Продаж не найдено
                    </Text>
                  ) : (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>ID</Table.Th>
                          <Table.Th>Дата</Table.Th>
                          <Table.Th>Клиент</Table.Th>
                          <Table.Th>Кол-во</Table.Th>
                          <Table.Th>Статус</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {batchDetails.recentSales.map((sale) => (
                          <Table.Tr key={sale.saleId}>
                            <Table.Td>#{sale.saleId}</Table.Td>
                            <Table.Td>{formatDate(sale.saleDate)}</Table.Td>
                            <Table.Td>{sale.clientName}</Table.Td>
                            <Table.Td>{sale.quantity}</Table.Td>
                            <Table.Td>
                              <Badge
                                color={sale.status === 'completed' ? 'green' : 'yellow'}
                                variant="light"
                              >
                                {sale.status === 'completed' ? 'Завершена' : 'Отменена'}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Paper>

                <Paper withBorder p="md">
                  <Title order={5} mb="xs">
                    Недавние списания
                  </Title>
                  {batchDetails.recentWriteOffs.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Списаний нет
                    </Text>
                  ) : (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Дата</Table.Th>
                          <Table.Th>Кол-во</Table.Th>
                          <Table.Th>Причина</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {batchDetails.recentWriteOffs.map((writeOff) => (
                          <Table.Tr key={writeOff.id}>
                            <Table.Td>{formatDate(writeOff.writeOffDate)}</Table.Td>
                            <Table.Td>{writeOff.quantity}</Table.Td>
                            <Table.Td>{writeOff.reason}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Paper>
              </Stack>
            </Stack>
          )}
        </MantineModal>
      </Stack>
    </Container>
  );
}
