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
  Select,
  TextInput,
  SimpleGrid,
  Tabs,
} from '@mantine/core';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  reportsService,
  SalesByPeriodItem,
} from '../services/reports.service';
import {
  ReportParams,
  ProfitByPlantTypeItem,
  ReturnsAndWriteoffsItem,
} from '../types/reports';
import { formatCurrency, formatDate } from '../utils/format';
import { exportToExcel } from '../utils/excel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('profit-by-shipment');
  const [params, setParams] = useState<ReportParams>({});
  const [profitShipmentViewMode, setProfitShipmentViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-profit-shipment-view',
    defaultValue: 'table',
  });
  const [profitClientViewMode, setProfitClientViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-profit-client-view',
    defaultValue: 'table',
  });
  const [buybackForecastViewMode, setBuybackForecastViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-buyback-forecast-view',
    defaultValue: 'table',
  });
  const [cashFlowViewMode, setCashFlowViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-cash-flow-view',
    defaultValue: 'table',
  });
  const [clientActivityViewMode, setClientActivityViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-client-activity-view',
    defaultValue: 'table',
  });
  const [salesByPeriodViewMode, setSalesByPeriodViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-sales-by-period-view',
    defaultValue: 'table',
  });
  const [profitByPlantTypeViewMode, setProfitByPlantTypeViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-profit-by-plant-type-view',
    defaultValue: 'table',
  });
  const [returnsAndWriteoffsViewMode, setReturnsAndWriteoffsViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'reports-returns-and-writeoffs-view',
    defaultValue: 'table',
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  const { data: profitByShipment, isLoading: isLoadingProfitByShipment } = useQuery({
    queryKey: ['reports', 'profit-by-shipment', params],
    queryFn: () => reportsService.getProfitByShipment(params),
    enabled: activeTab === 'profit-by-shipment',
  });

  const { data: profitByClient, isLoading: isLoadingProfitByClient } = useQuery({
    queryKey: ['reports', 'profit-by-client', params],
    queryFn: () => reportsService.getProfitByClient(params),
    enabled: activeTab === 'profit-by-client',
  });

  const { data: buybackForecast, isLoading: isLoadingBuybackForecast } = useQuery({
    queryKey: ['reports', 'buyback-forecast', params],
    queryFn: () => reportsService.getBuybackForecast(params),
    enabled: activeTab === 'buyback-forecast',
  });

  const { data: cashFlow, isLoading: isLoadingCashFlow } = useQuery({
    queryKey: ['reports', 'cash-flow', params],
    queryFn: () => reportsService.getCashFlow(params),
    enabled: activeTab === 'cash-flow',
  });

  const { data: clientActivity, isLoading: isLoadingClientActivity } = useQuery({
    queryKey: ['reports', 'client-activity', params],
    queryFn: () => reportsService.getClientActivity(params),
    enabled: activeTab === 'client-activity',
  });

  const { data: salesByPeriod, isLoading: isLoadingSalesByPeriod } = useQuery({
    queryKey: ['reports', 'sales-by-period', params, groupBy],
    queryFn: () => reportsService.getSalesByPeriod({ ...params, groupBy }),
    enabled: activeTab === 'sales-by-period',
  });

  const { data: profitByPlantType, isLoading: isLoadingProfitByPlantType } = useQuery({
    queryKey: ['reports', 'profit-by-plant-type', params],
    queryFn: () => reportsService.getProfitByPlantType(params),
    enabled: activeTab === 'profit-by-plant-type',
  });

  const { data: returnsAndWriteoffs, isLoading: isLoadingReturnsAndWriteoffs } = useQuery({
    queryKey: ['reports', 'returns-and-writeoffs', params],
    queryFn: () => reportsService.getReturnsAndWriteoffs(params),
    enabled: activeTab === 'returns-and-writeoffs',
  });
  const profitShipmentTableRef = useTableCardLabels(profitShipmentViewMode, [profitByShipment]);
  const profitClientTableRef = useTableCardLabels(profitClientViewMode, [profitByClient]);
  const buybackForecastTableRef = useTableCardLabels(buybackForecastViewMode, [buybackForecast]);
  const cashFlowTableRef = useTableCardLabels(cashFlowViewMode, [cashFlow]);
  const clientActivityTableRef = useTableCardLabels(clientActivityViewMode, [clientActivity]);
  const salesByPeriodTableRef = useTableCardLabels(salesByPeriodViewMode, [salesByPeriod]);
  const profitByPlantTypeTableRef = useTableCardLabels(profitByPlantTypeViewMode, [profitByPlantType]);
  const returnsAndWriteoffsTableRef = useTableCardLabels(returnsAndWriteoffsViewMode, [returnsAndWriteoffs]);

  const isLoading =
    isLoadingProfitByShipment ||
    isLoadingProfitByClient ||
    isLoadingBuybackForecast ||
    isLoadingCashFlow ||
    isLoadingClientActivity ||
    isLoadingSalesByPeriod ||
    isLoadingProfitByPlantType ||
    isLoadingReturnsAndWriteoffs;

  const handleExport = () => {
    try {
      switch (activeTab) {
        case 'profit-by-shipment':
          if (profitByShipment && profitByShipment.length > 0) {
            const exportData = profitByShipment.map((item) => ({
              'ID поставки': item.shipmentId,
              Дата: formatDate(item.shipmentDate),
              'Поставщик': item.supplierName,
              'Себестоимость': item.totalCost,
              Выручка: item.totalRevenue,
              Прибыль: item.profit,
              Маржа: `${item.profitMargin.toFixed(2)}%`,
            }));
            exportToExcel(exportData, 'profit-by-shipment', 'Прибыль по поставкам');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'profit-by-client':
          if (profitByClient && profitByClient.length > 0) {
            const exportData = profitByClient.map((item) => ({
              'ID клиента': item.clientId,
              Клиент: item.clientName,
              'Количество продаж': item.salesCount,
              Выручка: item.totalRevenue,
              'Себестоимость': item.totalCost,
              Прибыль: item.profit,
              Маржа: `${item.profitMargin.toFixed(2)}%`,
            }));
            exportToExcel(exportData, 'profit-by-client', 'Прибыль по клиентам');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'buyback-forecast':
          if (buybackForecast && buybackForecast.length > 0) {
            const exportData = buybackForecast.map((item) => ({
              'ID выкупа': item.buybackId,
              Клиент: item.clientName,
              'Планируемая дата': formatDate(item.plannedDate),
              Статус: item.status,
              Количество: item.totalQuantity,
              'Потенциальная выручка': item.estimatedRevenue,
              'Себестоимость': item.estimatedCost,
              Прибыль: item.estimatedProfit,
            }));
            exportToExcel(exportData, 'buyback-forecast', 'Прогноз выкупа');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'cash-flow':
          if (cashFlow && cashFlow.length > 0) {
            const exportData = cashFlow.map((item) => ({
              Дата: formatDate(item.date),
              Счёт: item.accountName,
              'Тип счёта': item.accountType,
              Приход: item.income,
              Расход: item.expense,
              Баланс: item.balance,
            }));
            exportToExcel(exportData, 'cash-flow', 'Движение средств');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'client-activity':
          if (clientActivity && clientActivity.length > 0) {
            const exportData = clientActivity.map((item) => ({
              'ID клиента': item.clientId,
              Клиент: item.clientName,
              'Первая покупка': item.firstPurchaseDate
                ? formatDate(item.firstPurchaseDate)
                : '-',
              'Последняя покупка': item.lastPurchaseDate
                ? formatDate(item.lastPurchaseDate)
                : '-',
              'Количество покупок': item.totalPurchases,
              Выручка: item.totalRevenue,
              Выкупов: item.buybacksCount,
            }));
            exportToExcel(exportData, 'client-activity', 'Активность клиентов');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'sales-by-period':
          if (salesByPeriod && salesByPeriod.length > 0) {
            const exportData = salesByPeriod.map((item) => ({
              Период: item.period,
              'Начало периода': formatDate(item.periodStart),
              'Конец периода': formatDate(item.periodEnd),
              'Количество продаж': item.salesCount,
              Выручка: item.totalRevenue,
              'Себестоимость': item.totalCost,
              Прибыль: item.profit,
              Маржа: `${item.profitMargin.toFixed(2)}%`,
              'Средний чек': item.averageSaleAmount,
            }));
            exportToExcel(exportData, 'sales-by-period', 'Продажи по периодам');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'profit-by-plant-type':
          if (profitByPlantType && profitByPlantType.length > 0) {
            const exportData = profitByPlantType.map((item) => ({
              'Тип растения': item.plantType,
              'Количество продано': item.totalQuantitySold,
              Выручка: item.totalRevenue,
              'Себестоимость': item.totalCost,
              Прибыль: item.profit,
              Маржа: `${item.profitMargin.toFixed(2)}%`,
              'Средняя цена за единицу': item.averagePricePerUnit,
              'Средняя себестоимость за единицу': item.averageCostPerUnit,
              'Количество продаж': item.salesCount,
            }));
            exportToExcel(exportData, 'profit-by-plant-type', 'Прибыльность по типам растений');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        case 'returns-and-writeoffs':
          if (returnsAndWriteoffs && returnsAndWriteoffs.length > 0) {
            const exportData = returnsAndWriteoffs.map((item) => ({
              'ID выкупа': item.buybackId,
              Клиент: item.clientName,
              Дата: formatDate(item.date),
              Тип: item.type === 'return' ? 'Возврат' : 'Списание',
              Статус: item.status,
              'Количество': item.totalQuantity,
              'Сумма выкупа': item.buybackAmount,
              'Себестоимость': item.originalCost,
              Убыток: item.loss,
              Примечания: item.notes || '-',
            }));
            exportToExcel(exportData, 'returns-and-writeoffs', 'Возвраты и списания');
            notifications.show({
              title: 'Успешно',
              message: 'Отчёт экспортирован в Excel',
              color: 'green',
            });
          }
          break;
        default:
          notifications.show({
            title: 'Ошибка',
            message: 'Выберите отчёт для экспорта',
            color: 'red',
          });
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось экспортировать отчёт',
        color: 'red',
      });
    }
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Отчёты
            </Title>
            <Text c="dimmed">Аналитика и отчёты по бизнесу</Text>
          </div>
        </Group>

        <Paper withBorder p="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <TextInput
              label="Дата начала"
              type="date"
              value={params.startDate || ''}
              onChange={(e) =>
                setParams({ ...params, startDate: e.currentTarget.value || undefined })
              }
            />
            <TextInput
              label="Дата окончания"
              type="date"
              value={params.endDate || ''}
              onChange={(e) =>
                setParams({ ...params, endDate: e.currentTarget.value || undefined })
              }
            />
            <TextInput
              label="ID клиента"
              type="number"
              value={params.clientId || ''}
              onChange={(e) =>
                setParams({
                  ...params,
                  clientId: e.currentTarget.value
                    ? parseInt(e.currentTarget.value)
                    : undefined,
                })
              }
            />
            <TextInput
              label="ID поставки"
              type="number"
              value={params.shipmentId || ''}
              onChange={(e) =>
                setParams({
                  ...params,
                  shipmentId: e.currentTarget.value
                    ? parseInt(e.currentTarget.value)
                    : undefined,
                })
              }
            />
            {activeTab === 'sales-by-period' && (
              <Select
                label="Группировка"
                value={groupBy}
                onChange={(value) =>
                  setGroupBy((value as 'day' | 'week' | 'month') || 'month')
                }
                data={[
                  { value: 'day', label: 'По дням' },
                  { value: 'week', label: 'По неделям' },
                  { value: 'month', label: 'По месяцам' },
                ]}
              />
            )}
          </SimpleGrid>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="profit-by-shipment">Прибыль по поставкам</Tabs.Tab>
            <Tabs.Tab value="profit-by-client">Прибыль по клиентам</Tabs.Tab>
            <Tabs.Tab value="sales-by-period">Продажи по периодам</Tabs.Tab>
            <Tabs.Tab value="profit-by-plant-type">Прибыльность по типам растений</Tabs.Tab>
            <Tabs.Tab value="returns-and-writeoffs">Возвраты и списания</Tabs.Tab>
            <Tabs.Tab value="buyback-forecast">Прогноз выкупа</Tabs.Tab>
            <Tabs.Tab value="cash-flow">Движение средств</Tabs.Tab>
            <Tabs.Tab value="client-activity">Активность клиентов</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profit-by-shipment" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Прибыль по поставкам</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={profitShipmentViewMode}
                  onChange={setProfitShipmentViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Paper withBorder>
                <Table
                  ref={profitShipmentTableRef}
                  className="gc-data-table"
                  data-view={profitShipmentViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID поставки</Table.Th>
                      <Table.Th>Дата</Table.Th>
                      <Table.Th>Поставщик</Table.Th>
                      <Table.Th>Себестоимость</Table.Th>
                      <Table.Th>Выручка</Table.Th>
                      <Table.Th>Прибыль</Table.Th>
                      <Table.Th>Маржа</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profitByShipment?.map((item) => (
                      <Table.Tr key={item.shipmentId}>
                        <Table.Td>#{item.shipmentId}</Table.Td>
                        <Table.Td>{formatDate(item.shipmentDate)}</Table.Td>
                        <Table.Td>{item.supplierName}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalCost)}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalRevenue)}</Table.Td>
                        <Table.Td>
                          <Text
                            fw={700}
                            c={item.profit >= 0 ? 'green' : 'red'}
                          >
                            {formatCurrency(item.profit)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={item.profitMargin >= 0 ? 'green' : 'red'}
                            variant="light"
                          >
                            {item.profitMargin.toFixed(2)}%
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="profit-by-client" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Прибыль по клиентам</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={profitClientViewMode}
                  onChange={setProfitClientViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Paper withBorder>
                <Table
                  ref={profitClientTableRef}
                  className="gc-data-table"
                  data-view={profitClientViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID клиента</Table.Th>
                      <Table.Th>Клиент</Table.Th>
                      <Table.Th>Количество продаж</Table.Th>
                      <Table.Th>Выручка</Table.Th>
                      <Table.Th>Себестоимость</Table.Th>
                      <Table.Th>Прибыль</Table.Th>
                      <Table.Th>Маржа</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {profitByClient?.map((item) => (
                      <Table.Tr key={item.clientId}>
                        <Table.Td>#{item.clientId}</Table.Td>
                        <Table.Td>{item.clientName}</Table.Td>
                        <Table.Td>{item.salesCount}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalRevenue)}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalCost)}</Table.Td>
                        <Table.Td>
                          <Text
                            fw={700}
                            c={item.profit >= 0 ? 'green' : 'red'}
                          >
                            {formatCurrency(item.profit)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={item.profitMargin >= 0 ? 'green' : 'red'}
                            variant="light"
                          >
                            {item.profitMargin.toFixed(2)}%
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="sales-by-period" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Продажи по периодам</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={salesByPeriodViewMode}
                  onChange={setSalesByPeriodViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : salesByPeriod && salesByPeriod.length > 0 ? (
              <Stack gap="md">
                <Paper withBorder p="md">
                  <Text fw={600} mb="md">
                    Динамика продаж
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--mantine-color-text)' }}
                        contentStyle={{
                          backgroundColor: 'var(--mantine-color-body)',
                          border: '1px solid var(--mantine-color-default-border)',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalRevenue"
                        stroke="var(--mantine-color-blue-6)"
                        strokeWidth={2}
                        name="Выручка"
                      />
                      <Line
                        type="monotone"
                        dataKey="totalCost"
                        stroke="var(--mantine-color-red-6)"
                        strokeWidth={2}
                        name="Себестоимость"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="var(--mantine-color-green-6)"
                        strokeWidth={2}
                        name="Прибыль"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
                <Paper withBorder>
                  <Table
                  ref={salesByPeriodTableRef}
                  className="gc-data-table"
                  data-view={salesByPeriodViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Период</Table.Th>
                      <Table.Th>Начало</Table.Th>
                      <Table.Th>Конец</Table.Th>
                      <Table.Th>Продаж</Table.Th>
                      <Table.Th>Выручка</Table.Th>
                      <Table.Th>Себестоимость</Table.Th>
                      <Table.Th>Прибыль</Table.Th>
                      <Table.Th>Маржа</Table.Th>
                      <Table.Th>Средний чек</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {salesByPeriod.map((item, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>{item.period}</Table.Td>
                        <Table.Td>{formatDate(item.periodStart)}</Table.Td>
                        <Table.Td>{formatDate(item.periodEnd)}</Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light">
                            {item.salesCount}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatCurrency(item.totalRevenue)}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalCost)}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={item.profit >= 0 ? 'green' : 'red'}
                            variant="light"
                          >
                            {formatCurrency(item.profit)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={item.profitMargin >= 0 ? 'green' : 'red'}
                            variant="light"
                          >
                            {item.profitMargin.toFixed(2)}%
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatCurrency(item.averageSaleAmount)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                </Paper>
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Нет данных за выбранный период
              </Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="profit-by-plant-type" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Прибыльность по типам растений</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={profitByPlantTypeViewMode}
                  onChange={setProfitByPlantTypeViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : profitByPlantType && profitByPlantType.length > 0 ? (
              <Stack gap="md">
                <Paper withBorder p="md">
                  <Text fw={600} mb="md">
                    Прибыльность по типам растений
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profitByPlantType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="plantType"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--mantine-color-text)' }}
                        contentStyle={{
                          backgroundColor: 'var(--mantine-color-body)',
                          border: '1px solid var(--mantine-color-default-border)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalRevenue"
                        fill="var(--mantine-color-blue-6)"
                        name="Выручка"
                      />
                      <Bar
                        dataKey="totalCost"
                        fill="var(--mantine-color-red-6)"
                        name="Себестоимость"
                      />
                      <Bar
                        dataKey="profit"
                        fill="var(--mantine-color-green-6)"
                        name="Прибыль"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                <Paper withBorder>
                  <Table
                    ref={profitByPlantTypeTableRef}
                    className="gc-data-table"
                    data-view={profitByPlantTypeViewMode}
                    striped
                    highlightOnHover
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Тип растения</Table.Th>
                        <Table.Th>Количество продано</Table.Th>
                        <Table.Th>Выручка</Table.Th>
                        <Table.Th>Себестоимость</Table.Th>
                        <Table.Th>Прибыль</Table.Th>
                        <Table.Th>Маржа</Table.Th>
                        <Table.Th>Средняя цена</Table.Th>
                        <Table.Th>Средняя себестоимость</Table.Th>
                        <Table.Th>Продаж</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {profitByPlantType.map((item, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>
                            <Text fw={500}>{item.plantType}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="blue" variant="light">
                              {item.totalQuantitySold} шт
                            </Badge>
                          </Table.Td>
                          <Table.Td>{formatCurrency(item.totalRevenue)}</Table.Td>
                          <Table.Td>{formatCurrency(item.totalCost)}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={item.profit >= 0 ? 'green' : 'red'}
                              variant="light"
                            >
                              {formatCurrency(item.profit)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={item.profitMargin >= 0 ? 'green' : 'red'}
                              variant="light"
                            >
                              {item.profitMargin.toFixed(2)}%
                            </Badge>
                          </Table.Td>
                          <Table.Td>{formatCurrency(item.averagePricePerUnit)}</Table.Td>
                          <Table.Td>{formatCurrency(item.averageCostPerUnit)}</Table.Td>
                          <Table.Td>
                            <Badge color="gray" variant="light">
                              {item.salesCount}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Нет данных за выбранный период
              </Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="returns-and-writeoffs" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Возвраты и списания</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={returnsAndWriteoffsViewMode}
                  onChange={setReturnsAndWriteoffsViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : returnsAndWriteoffs && returnsAndWriteoffs.length > 0 ? (
              <Paper withBorder>
                <Table
                  ref={returnsAndWriteoffsTableRef}
                  className="gc-data-table"
                  data-view={returnsAndWriteoffsViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID</Table.Th>
                      <Table.Th>Клиент</Table.Th>
                      <Table.Th>Дата</Table.Th>
                      <Table.Th>Тип</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th>Количество</Table.Th>
                      <Table.Th>Сумма выкупа</Table.Th>
                      <Table.Th>Себестоимость</Table.Th>
                      <Table.Th>Убыток</Table.Th>
                      <Table.Th>Примечания</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {returnsAndWriteoffs.map((item) => (
                      <Table.Tr key={item.buybackId}>
                        <Table.Td>#{item.buybackId}</Table.Td>
                        <Table.Td>{item.clientName}</Table.Td>
                        <Table.Td>{formatDate(item.date)}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={item.type === 'return' ? 'blue' : 'red'}
                            variant="light"
                          >
                            {item.type === 'return' ? 'Возврат' : 'Списание'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              item.status === 'completed'
                                ? 'green'
                                : item.status === 'declined'
                                  ? 'red'
                                  : 'gray'
                            }
                            variant="light"
                          >
                            {item.status === 'completed'
                              ? 'Завершён'
                              : item.status === 'declined'
                                ? 'Отклонён'
                                : item.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light">
                            {item.totalQuantity} шт
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {item.buybackAmount > 0
                            ? formatCurrency(item.buybackAmount)
                            : '-'}
                        </Table.Td>
                        <Table.Td>{formatCurrency(item.originalCost)}</Table.Td>
                        <Table.Td>
                          <Badge color="red" variant="light">
                            {formatCurrency(item.loss)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {item.notes || '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Нет данных за выбранный период
              </Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="buyback-forecast" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Прогноз выкупа</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={buybackForecastViewMode}
                  onChange={setBuybackForecastViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Paper withBorder>
                <Table
                  ref={buybackForecastTableRef}
                  className="gc-data-table"
                  data-view={buybackForecastViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID выкупа</Table.Th>
                      <Table.Th>Клиент</Table.Th>
                      <Table.Th>Планируемая дата</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th>Количество</Table.Th>
                      <Table.Th>Потенциальная выручка</Table.Th>
                      <Table.Th>Себестоимость</Table.Th>
                      <Table.Th>Прибыль</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {buybackForecast?.map((item) => (
                      <Table.Tr key={item.buybackId}>
                        <Table.Td>#{item.buybackId}</Table.Td>
                        <Table.Td>{item.clientName}</Table.Td>
                        <Table.Td>{formatDate(item.plannedDate)}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{item.status}</Badge>
                        </Table.Td>
                        <Table.Td>{item.totalQuantity}</Table.Td>
                        <Table.Td>{formatCurrency(item.estimatedRevenue)}</Table.Td>
                        <Table.Td>{formatCurrency(item.estimatedCost)}</Table.Td>
                        <Table.Td>
                          <Text
                            fw={700}
                            c={item.estimatedProfit >= 0 ? 'green' : 'red'}
                          >
                            {formatCurrency(item.estimatedProfit)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="cash-flow" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Движение денежных средств</Text>
              <Group gap="xs">
                <DataViewToggle value={cashFlowViewMode} onChange={setCashFlowViewMode} />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : cashFlow && cashFlow.length > 0 ? (
              <Stack gap="md">
                <Paper withBorder p="md">
                  <Text fw={600} mb="md">
                    Движение денежных средств
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashFlow}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: 'var(--mantine-color-text)' }}
                        contentStyle={{
                          backgroundColor: 'var(--mantine-color-body)',
                          border: '1px solid var(--mantine-color-default-border)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="var(--mantine-color-green-6)"
                        name="Приход"
                      />
                      <Bar
                        dataKey="expense"
                        fill="var(--mantine-color-red-6)"
                        name="Расход"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                <Paper withBorder>
                  <Table
                    ref={cashFlowTableRef}
                    className="gc-data-table"
                    data-view={cashFlowViewMode}
                    striped
                    highlightOnHover
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Дата</Table.Th>
                        <Table.Th>Счёт</Table.Th>
                        <Table.Th>Тип счёта</Table.Th>
                        <Table.Th>Приход</Table.Th>
                        <Table.Th>Расход</Table.Th>
                        <Table.Th>Баланс</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {cashFlow.map((item, index) => (
                        <Table.Tr key={index}>
                          <Table.Td>{formatDate(item.date)}</Table.Td>
                          <Table.Td>{item.accountName}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{item.accountType}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text c="green" fw={700}>
                              {formatCurrency(item.income)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text c="red" fw={700}>
                              {formatCurrency(item.expense)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              fw={700}
                              c={item.balance >= 0 ? 'green' : 'red'}
                            >
                              {formatCurrency(item.balance)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Нет данных за выбранный период
              </Text>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="client-activity" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Активность клиентов</Text>
              <Group gap="xs">
                <DataViewToggle
                  value={clientActivityViewMode}
                  onChange={setClientActivityViewMode}
                />
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExport}
                  variant="light"
                >
                  Экспорт
                </Button>
              </Group>
            </Group>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Paper withBorder>
                <Table
                  ref={clientActivityTableRef}
                  className="gc-data-table"
                  data-view={clientActivityViewMode}
                  striped
                  highlightOnHover
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>ID клиента</Table.Th>
                      <Table.Th>Клиент</Table.Th>
                      <Table.Th>Первая покупка</Table.Th>
                      <Table.Th>Последняя покупка</Table.Th>
                      <Table.Th>Количество покупок</Table.Th>
                      <Table.Th>Выручка</Table.Th>
                      <Table.Th>Выкупов</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {clientActivity?.map((item) => (
                      <Table.Tr key={item.clientId}>
                        <Table.Td>#{item.clientId}</Table.Td>
                        <Table.Td>{item.clientName}</Table.Td>
                        <Table.Td>
                          {item.firstPurchaseDate
                            ? formatDate(item.firstPurchaseDate)
                            : '-'}
                        </Table.Td>
                        <Table.Td>
                          {item.lastPurchaseDate
                            ? formatDate(item.lastPurchaseDate)
                            : '-'}
                        </Table.Td>
                        <Table.Td>{item.totalPurchases}</Table.Td>
                        <Table.Td>{formatCurrency(item.totalRevenue)}</Table.Td>
                        <Table.Td>{item.buybacksCount}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
