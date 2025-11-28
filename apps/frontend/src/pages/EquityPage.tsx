import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Group,
  Badge,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { equityService } from '../services/equity.service';
import { formatCurrency } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SimpleBarChart } from '../components/charts/SimpleBarChart';

export function EquityPage() {
  const { data: equity, isLoading } = useQuery({
    queryKey: ['equity'],
    queryFn: () => equityService.getEquity(),
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!equity) {
    return (
      <Container size="xl">
        <Title order={2} mb="md">
          Распределение долей
        </Title>
        <Text c="dimmed">Не удалось загрузить данные</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title order={2} mb="md">
        Распределение долей владельцев
      </Title>

      {/* Сводка по активам */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Общие активы
              </Text>
              <Text fw={700} size="xl" c="greenCycle">
                {formatCurrency(equity.totalAssets)}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Денежные активы
              </Text>
              <Text fw={700} size="xl" c="blue">
                {formatCurrency(equity.cashAssets)}
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <div>
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Товары на складе
              </Text>
              <Text fw={700} size="xl" c="orange">
                {formatCurrency(equity.inventoryAssets)}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* Информация о владельцах */}
      <Paper withBorder p="md" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600} size="lg">
              Владельцы бизнеса
            </Text>
            <Text c="dimmed" size="sm">
              Всего владельцев: {equity.ownersCount}
            </Text>
          </div>
        </Group>

        <Divider mb="md" />

        {equity.owners.length > 0 ? (
          <Stack gap="xl">
             {equity.owners.map((owner) => {
               const investments = parseFloat(owner.totalInvestments);
               const revenueShare = parseFloat(owner.equityValue); // Доля выручки
               const withdrawals = parseFloat(owner.totalWithdrawals);
               const availableCash = parseFloat(owner.availableCash); // Чистая прибыль
               // Текущий баланс = Вложения + Чистая прибыль
               const currentBalance = investments + availableCash;

                 const chartData = [
                   {
                     name: owner.fullName,
                     'Вложения': investments,
                     'Доля выручки': revenueShare,
                     'Изъятия': withdrawals,
                     'Чистая прибыль': availableCash,
                   },
                 ];

              return (
                <Paper key={owner.userId} withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <div>
                      <Text fw={600} size="lg">
                        {owner.fullName}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {owner.email}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text c="dimmed" size="xs" tt="uppercase" fw={700} mb={4}>
                        Текущий баланс:
                      </Text>
                      <Text fw={700} size="xl" c="orange">
                        {formatCurrency(currentBalance.toFixed(2))}
                      </Text>
                      <Badge variant="light" color="greenCycle" size="lg" mt="xs">
                        {owner.share.toFixed(2)}%
                      </Badge>
                    </div>
                  </Group>

                  {/* График для текущего владельца */}
                  <SimpleBarChart
                    data={chartData}
                    xKey="name"
                    height={300}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      bars={[
                        { key: 'Вложения', color: '#9333ea' },
                        { key: 'Доля выручки', color: '#339af0' },
                        { key: 'Изъятия', color: '#ff6b6b' },
                        { key: 'Чистая прибыль', color: '#40c057' },
                      ]}
                    yAxisTickFormatter={(value: number) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      }
                      if (value >= 1000) {
                        return `${(value / 1000).toFixed(0)}K`;
                      }
                      return value.toString();
                    }}
                    tooltipFormatter={(value: number | string, name: string) => [
                      formatCurrency(String(value)),
                      name,
                    ]}
                    labelFormatter={() => owner.fullName}
                  />

                  {/* Детальная информация */}
                  <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md" mt="md">
                     <div>
                       <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                         Вложения
                       </Text>
                       <Text fw={600} size="lg" style={{ color: '#9333ea' }}>
                         {formatCurrency(owner.totalInvestments)}
                       </Text>
                     </div>
                     <div>
                       <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                         Доля выручки
                       </Text>
                       <Text fw={600} size="lg" c="blue">
                         {formatCurrency(owner.equityValue)}
                       </Text>
                     </div>
                     <div>
                       <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                         Изъятия
                       </Text>
                       <Text fw={600} size="lg" c="red">
                         {formatCurrency(owner.totalWithdrawals)}
                       </Text>
                     </div>
                     <div>
                       <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                         Чистая прибыль
                       </Text>
                       <Text fw={600} size="lg" c="greenCycle">
                         {formatCurrency(owner.availableCash)}
                       </Text>
                     </div>
                   </SimpleGrid>
                </Paper>
              );
            })}

            {/* Общий информационный блок */}
            <Paper
            withBorder
            p="md"
            radius="md"
            mt="md"
            style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
          >
            <Text fw={700} size="sm" mb="md" c="dimmed">
              Формулы расчетов (демо-данные)
            </Text>
            {(() => {
              const demoInvestments = 1200000;
              const demoShare = 40;
              const demoRevenue = 5000000;
              const demoExpenses = 750000;
              const demoWithdrawals = 300000;
              const demoRevenueShare = ((demoRevenue - demoExpenses) * demoShare) / 100;
              const demoNetProfit = demoRevenueShare - demoWithdrawals - demoInvestments;
              const demoBalance = demoInvestments + demoNetProfit;

              return (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Stack gap="sm">
                    <Text fw={600} size="sm" style={{ color: '#9333ea' }}>
                      Вложения
                    </Text>
                    <Text size="xs" c="dimmed">
                      Прямые пополнения + инвестиции в поставки
                    </Text>
                    <Text
                      size="xs"
                      style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      1) Вложения = {formatCurrency(demoInvestments.toFixed(2))}
                    </Text>

                    <Text fw={600} size="sm" mt="md" style={{ color: '#339af0' }}>
                      Доля выручки
                    </Text>
                    <Text size="xs" c="dimmed">
                      (Общая выручка - Общие расходы) × Доля
                    </Text>
                    <Text
                      size="xs"
                      style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      2) ({formatCurrency(demoRevenue.toFixed(2))} - {formatCurrency(demoExpenses.toFixed(2))}) × {demoShare}% ={' '}
                      {formatCurrency(demoRevenueShare.toFixed(2))}
                    </Text>
                  </Stack>

                  <Stack gap="sm">
                    <Text fw={600} size="sm" style={{ color: '#40c057' }}>
                      Чистая прибыль
                    </Text>
                    <Text size="xs" c="dimmed">
                      Доля выручки - Изъятия - Вложения
                    </Text>
                    <Text
                      size="xs"
                      style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      3) {formatCurrency(demoRevenueShare.toFixed(2))} - {formatCurrency(demoWithdrawals.toFixed(2))} -{' '}
                      {formatCurrency(demoInvestments.toFixed(2))} = {formatCurrency(demoNetProfit.toFixed(2))}
                    </Text>

                    <Text fw={600} size="sm" mt="md" style={{ color: '#fd7e14' }}>
                      Текущий баланс
                    </Text>
                    <Text size="xs" c="dimmed">
                      Вложения + Чистая прибыль
                    </Text>
                    <Text
                      size="xs"
                      style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px' }}
                    >
                      4) {formatCurrency(demoInvestments.toFixed(2))} + {formatCurrency(demoNetProfit.toFixed(2))} ={' '}
                      {formatCurrency(demoBalance.toFixed(2))}
                    </Text>
                  </Stack>
                </SimpleGrid>
              );
            })()}
          </Paper>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="md">
            Нет владельцев бизнеса
          </Text>
        )}
      </Paper>

      {/* Детальная таблица */}
      <Paper withBorder p="md" radius="md">
        <Text fw={600} size="lg" mb="md">
          Детальная информация
        </Text>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Владелец</Table.Th>
              <Table.Th>Доля, %</Table.Th>
              <Table.Th>Вложения</Table.Th>
              <Table.Th>Доля выручки</Table.Th>
              <Table.Th>Чистая прибыль</Table.Th>
              <Table.Th>Денежные изъятия</Table.Th>
              <Table.Th>Баланс средств</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {equity.owners.map((owner) => {
              const investments = parseFloat(owner.totalInvestments);
              const availableCash = parseFloat(owner.availableCash);
              const currentBalance = investments + availableCash;

              return (
                <Table.Tr key={owner.userId}>
                  <Table.Td>
                    <Text fw={600}>{owner.fullName}</Text>
                    <Text c="dimmed" size="sm">
                      {owner.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="greenCycle">
                      {owner.share.toFixed(2)}%
                    </Badge>
                  </Table.Td>
                <Table.Td>
                  <Text fw={600} style={{ color: '#9333ea' }}>
                    {formatCurrency(owner.totalInvestments)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={600} style={{ color: '#339af0' }}>
                    {formatCurrency(owner.equityValue)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={700} style={{ color: '#40c057' }}>
                    {formatCurrency(owner.availableCash)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text fw={600} style={{ color: '#ff6b6b' }}>
                    {formatCurrency(owner.totalWithdrawals)}
                  </Text>
                </Table.Td>
                  <Table.Td>
                    <Text fw={700} c="orange">
                      {formatCurrency(currentBalance.toFixed(2))}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}

