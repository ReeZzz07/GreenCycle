import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  Stack,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconCurrencyDollar,
  IconPackage,
  IconTrendingUp,
  IconShoppingCart,
  IconCheck,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import { inventoryService } from '../services/inventory.service';
import { salesService } from '../services/sales.service';
import { shipmentsService } from '../services/shipments.service';
import { formatCurrency } from '../utils/format';

export function DashboardPage() {
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => financeService.getAllAccounts(),
  });

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getSummary(),
  });

  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.getAll(),
  });

  const { data: shipments, isLoading: isLoadingShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentsService.getAll(),
  });

  const totalBalance =
    accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;

  const totalInventory = inventory?.reduce((sum, item) => sum + item.quantityCurrent, 0) || 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySales =
    sales?.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear &&
        sale.status === 'completed'
      );
    }) || [];

  const monthlySalesTotal =
    monthlySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;

  const monthlyShipments =
    shipments?.filter((shipment) => {
      const shipmentDate = new Date(shipment.arrivalDate);
      return (
        shipmentDate.getMonth() === currentMonth &&
        shipmentDate.getFullYear() === currentYear
      );
    }) || [];

  const monthlyShipmentsTotal =
    monthlyShipments.reduce((sum, shipment) => sum + Number(shipment.totalCost), 0) || 0;

  // Подсчитываем общее количество проданных единиц товара из всех завершенных продаж
  const totalSoldUnits =
    sales?.reduce((sum, sale) => {
      if (sale.status === 'completed' && sale.items) {
        return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }
      return sum;
    }, 0) || 0;

  const isLoading =
    isLoadingAccounts || isLoadingInventory || isLoadingSales || isLoadingShipments;

  if (isLoading) {
    return (
      <Container size="xl">
        <Center h="50vh">
          <Loader size="lg" color="greenCycle" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Дашборд
          </Title>
          <Text c="dimmed">Обзор ключевых метрик и операций</Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Баланс
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(totalBalance)}
                </Text>
              </div>
              <IconCurrencyDollar
                size={32}
                style={{ color: 'var(--mantine-color-greenCycle-6)' }}
              />
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  На складе
                </Text>
                <Text fw={700} size="xl">
                  {totalInventory} шт
                </Text>
              </div>
              <IconPackage
                size={32}
                style={{ color: 'var(--mantine-color-greenCycle-6)' }}
              />
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Продажи (месяц)
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(monthlySalesTotal)}
                </Text>
              </div>
              <IconTrendingUp
                size={32}
                style={{ color: 'var(--mantine-color-greenCycle-6)' }}
              />
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Закупки (месяц)
                </Text>
                <Text fw={700} size="xl">
                  {formatCurrency(monthlyShipmentsTotal)}
                </Text>
              </div>
              <IconShoppingCart
                size={32}
                style={{ color: 'var(--mantine-color-greenCycle-6)' }}
              />
            </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Продано единиц
                </Text>
                <Text fw={700} size="xl">
                  {totalSoldUnits} шт
                </Text>
              </div>
              <IconCheck
                size={32}
                style={{ color: 'var(--mantine-color-greenCycle-6)' }}
              />
            </Group>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}