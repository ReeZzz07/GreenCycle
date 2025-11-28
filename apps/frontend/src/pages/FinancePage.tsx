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
  SimpleGrid,
  Tabs,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconTrash,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { financeService } from '../services/finance.service';
import { usersService } from '../services/users.service';
import { shipmentsService } from '../services/shipments.service';
import {
  Account,
  Transaction,
  PartnerWithdrawal,
  OtherExpense,
  CreateAccountDto,
  CreateTransactionDto,
  CreatePartnerWithdrawalDto,
  CreateOtherExpenseDto,
  AccountType,
  TransactionType,
} from '../types/finance';
import { User } from '../types/users';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';

export function FinancePage() {
  const [accountModalOpened, setAccountModalOpened] = useState(false);
  const [transactionModalOpened, setTransactionModalOpened] = useState(false);
  const [cashWithdrawalModalOpened, setCashWithdrawalModalOpened] = useState(false);
  const [goodsWithdrawalModalOpened, setGoodsWithdrawalModalOpened] = useState(false);
  const [otherExpenseModalOpened, setOtherExpenseModalOpened] = useState(false);
  const [viewTransactionModalOpened, setViewTransactionModalOpened] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewWithdrawalModalOpened, setViewWithdrawalModalOpened] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PartnerWithdrawal | null>(null);
  const [viewAccountModalOpened, setViewAccountModalOpened] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('accounts');
  const [accountsViewMode, setAccountsViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'finance-accounts-view-mode',
    defaultValue: 'table',
  });
  const [transactionsViewMode, setTransactionsViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'finance-transactions-view-mode',
    defaultValue: 'table',
  });
  const [cancelledViewMode, setCancelledViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'finance-cancelled-view-mode',
    defaultValue: 'table',
  });
  const [withdrawalsViewMode, setWithdrawalsViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'finance-withdrawals-view-mode',
    defaultValue: 'table',
  });
  const [otherExpensesViewMode, setOtherExpensesViewMode] = useLocalStorage<'table' | 'cards'>({
    key: 'finance-other-expenses-view-mode',
    defaultValue: 'table',
  });
  const queryClient = useQueryClient();

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => financeService.getAllAccounts(),
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => financeService.getAllTransactions(),
  });

  // Загрузка детальной информации о транзакции
  const { data: transactionDetails } = useQuery({
    queryKey: ['transaction', selectedTransaction?.id],
    queryFn: () => financeService.getTransactionById(selectedTransaction!.id),
    enabled: !!selectedTransaction && viewTransactionModalOpened,
  });

  // Загрузка детальной информации об изъятии
  const { data: withdrawalDetails } = useQuery({
    queryKey: ['partnerWithdrawal', selectedWithdrawal?.id],
    queryFn: () => financeService.getPartnerWithdrawalById(selectedWithdrawal!.id),
    enabled: !!selectedWithdrawal && viewWithdrawalModalOpened,
  });

  // Загрузка детальной информации о счете
  const { data: accountDetails } = useQuery({
    queryKey: ['account', selectedAccount?.id],
    queryFn: () => financeService.getAccountById(selectedAccount!.id),
    enabled: !!selectedAccount && viewAccountModalOpened,
  });

  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['partnerWithdrawals'],
    queryFn: () => financeService.getAllPartnerWithdrawals(),
  });

  const { data: otherExpenses, isLoading: isLoadingOtherExpenses } = useQuery({
    queryKey: ['otherExpenses'],
    queryFn: () => financeService.getAllOtherExpenses(),
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  const { data: shipments, isLoading: isLoadingShipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => shipmentsService.getAll(),
  });

  // Фильтруем только супер-админов
  const superAdmins = users?.filter((user) => user.role.name === 'super_admin') || [];
  const superAdminOptions = superAdmins.map((user) => ({
    value: user.id.toString(),
    label: `${user.fullName} (${user.email})`,
  }));

  const accountForm = useForm<CreateAccountDto>({
    initialValues: {
      name: '',
      type: AccountType.CASH,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Укажите название'),
    },
  });

  const transactionForm = useForm<CreateTransactionDto>({
    initialValues: {
      accountId: 0,
      amount: 0,
      type: TransactionType.SALE,
      description: '',
    },
    validate: {
      accountId: (value) => (value > 0 ? null : 'Выберите счёт'),
      amount: (value) => (value !== 0 ? null : 'Укажите сумму'),
    },
  });

  const withdrawalForm = useForm<CreatePartnerWithdrawalDto>({
    initialValues: {
      type: 'cash',
      amountOrQuantity: '',
      costValue: '',
      reason: '',
      accountId: 0,
      userId: 0,
      withdrawalDate: '',
      shipmentId: 0,
    },
    validate: {
      amountOrQuantity: (value) =>
        value.trim().length > 0 ? null : 'Укажите сумму или количество',
      reason: (value) => (value.trim().length > 0 ? null : 'Укажите причину'),
      accountId: (value, values) =>
        values.type === 'cash' && (!value || value === 0)
          ? 'Выберите счёт'
          : null,
      userId: (value) => (!value || value === 0 ? 'Выберите пользователя' : null),
      shipmentId: (value, values) =>
        values.type === 'goods' && (!value || value === 0)
          ? 'Выберите поставку'
          : null,
    },
  });

  const otherExpenseForm = useForm<CreateOtherExpenseDto>({
    initialValues: {
      accountId: 0,
      amount: 0,
      category: '',
      description: '',
      expenseDate: '',
    },
    validate: {
      accountId: (value) => (value > 0 ? null : 'Выберите счёт'),
      amount: (value) => (value > 0 ? null : 'Укажите сумму'),
      category: (value) => (value.trim().length > 0 ? null : 'Укажите категорию'),
    },
  });

  // Автоматический расчет стоимости для изъятий типа "товар"
  useEffect(() => {
    if (
      goodsWithdrawalModalOpened &&
      withdrawalForm.values.shipmentId &&
      withdrawalForm.values.amountOrQuantity
    ) {
      const selectedShipment = shipments?.find(
        (s) => s.id === withdrawalForm.values.shipmentId,
      );

      if (selectedShipment && selectedShipment.batches) {
        // Рассчитываем общее количество товаров в поставке
        const totalQuantity = selectedShipment.batches.reduce(
          (sum, batch) => sum + batch.quantityInitial,
          0,
        );

        if (totalQuantity > 0) {
          // Рассчитываем среднюю себестоимость на единицу
          const costPerUnit = Number(selectedShipment.totalCost) / totalQuantity;
          const quantity = parseFloat(withdrawalForm.values.amountOrQuantity) || 0;
          const calculatedCost = quantity * costPerUnit;

          // Обновляем стоимость только если она не была изменена вручную
          // или если она отличается от рассчитанной
          withdrawalForm.setFieldValue('costValue', calculatedCost.toFixed(2));
        }
      }
    }
  }, [
    goodsWithdrawalModalOpened,
    withdrawalForm.values.shipmentId,
    withdrawalForm.values.amountOrQuantity,
    shipments,
  ]);

  const createAccountMutation = useMutation({
    mutationFn: (dto: CreateAccountDto) => financeService.createAccount(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Счёт создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccountModalOpened(false);
      accountForm.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать счёт',
        color: 'red',
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (dto: CreateTransactionDto) =>
      financeService.createTransaction(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Транзакция создана',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setTransactionModalOpened(false);
      transactionForm.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать транзакцию',
        color: 'red',
      });
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: (dto: CreatePartnerWithdrawalDto) => {
      // Преобразуем данные для отправки на бэкенд
      const payload: CreatePartnerWithdrawalDto = {
        type: dto.type,
        amountOrQuantity: typeof dto.amountOrQuantity === 'string' 
          ? parseFloat(dto.amountOrQuantity) || 0 
          : dto.amountOrQuantity,
        reason: dto.reason,
      };

      // Добавляем userId если он указан и больше 0
      if (dto.userId && dto.userId > 0) {
        payload.userId = dto.userId;
      }

      // Добавляем accountId только если он указан и больше 0
      if (dto.accountId && dto.accountId > 0) {
        payload.accountId = dto.accountId;
      }

      // Добавляем costValue только если он указан
      if (dto.costValue !== undefined && dto.costValue !== '' && dto.costValue !== null) {
        payload.costValue = typeof dto.costValue === 'string' 
          ? parseFloat(dto.costValue) || undefined 
          : dto.costValue;
      }

      // Добавляем shipmentId только если он указан и больше 0
      if (dto.shipmentId && dto.shipmentId > 0) {
        payload.shipmentId = dto.shipmentId;
      }

      // Добавляем withdrawalDate если он указан (может быть пустой строкой)
      if (dto.withdrawalDate !== undefined && dto.withdrawalDate !== null && dto.withdrawalDate !== '') {
        const trimmedDate = typeof dto.withdrawalDate === 'string' ? dto.withdrawalDate.trim() : dto.withdrawalDate;
        if (trimmedDate !== '') {
          payload.withdrawalDate = trimmedDate;
        }
      }

      return financeService.createPartnerWithdrawal(payload);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Изъятие создано',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['partnerWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // Инвалидируем кэш для поставок, так как при изъятии товара обновляются данные поставки
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setCashWithdrawalModalOpened(false);
      setGoodsWithdrawalModalOpened(false);
      withdrawalForm.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать изъятие',
        color: 'red',
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteAccount(id),
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Успешно',
        message: 'Счёт удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', variables] });
      
      // Закрываем модальное окно просмотра, если открыт удаляемый счет
      if (selectedAccount?.id === variables) {
        setViewAccountModalOpened(false);
        setSelectedAccount(null);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить счёт',
        color: 'red',
      });
    },
  });

  const createOtherExpenseMutation = useMutation({
    mutationFn: (dto: CreateOtherExpenseDto) => financeService.createOtherExpense(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Прочий расход создан',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['otherExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setOtherExpenseModalOpened(false);
      otherExpenseForm.reset();
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось создать прочий расход',
        color: 'red',
      });
    },
  });

  const deleteOtherExpenseMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteOtherExpense(id),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Прочий расход удалён',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['otherExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить прочий расход',
        color: 'red',
      });
    },
  });

  const deleteWithdrawalMutation = useMutation({
    mutationFn: (id: number) => financeService.deletePartnerWithdrawal(id),
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Успешно',
        message: 'Изъятие удалено',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['partnerWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['partnerWithdrawal', variables] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Инвалидируем кэш для поставок, так как при удалении изъятия товара восстанавливаются данные поставки
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      
      // Закрываем модальное окно просмотра, если открыто удаляемое изъятие
      if (selectedWithdrawal?.id === variables) {
        setViewWithdrawalModalOpened(false);
        setSelectedWithdrawal(null);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Ошибка',
        message: error.message || 'Не удалось удалить изъятие',
        color: 'red',
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: number) => financeService.deleteTransaction(id),
    onSuccess: (response: any) => {
      if (response?.data?.cancelled) {
        notifications.show({
          title: 'Успешно',
          message: 'Транзакция помечена как отмененная (связана с отмененной продажей)',
          color: 'blue',
        });
      } else {
        notifications.show({
          title: 'Успешно',
          message: 'Транзакция удалена',
          color: 'green',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', selectedTransaction?.id] });
    },
    onError: (error: any) => {
      // Извлекаем сообщение об ошибке из ответа сервера
      let errorMessage = 'Не удалось удалить транзакцию';
      
      if (error.response?.data?.error) {
        // Если есть объект error в ответе
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        } else if (Array.isArray(error.response.data.error.message)) {
          // Если message - массив (validation errors)
          errorMessage = error.response.data.error.message.join(', ');
        }
      } else if (error.response?.data?.message) {
        // Если сообщение на верхнем уровне
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

  const updateTransactionStatusMutation = useMutation({
    mutationFn: ({ id, isCancelled }: { id: number; isCancelled: boolean }) =>
      financeService.updateTransactionStatus(id, isCancelled),
    onSuccess: (_, variables) => {
      notifications.show({
        title: 'Успешно',
        message: variables.isCancelled
          ? 'Транзакция помечена как отмененная'
          : 'Транзакция помечена как активная',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // Обновляем selectedTransaction если он открыт
      if (selectedTransaction?.id === variables.id) {
        setSelectedTransaction((prev) =>
          prev ? { ...prev, isCancelled: variables.isCancelled } : null,
        );
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Не удалось изменить статус транзакции';
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

  const totalBalance =
    accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;

  // Разделяем транзакции на активные и отмененные
  const activeTransactions = transactions?.filter((t) => !t.isCancelled) || [];
  const cancelledTransactions = transactions?.filter((t) => t.isCancelled) || [];
  const cancelledTransactionsTotal = cancelledTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );
  const accountsTableRef = useTableCardLabels(accountsViewMode, [accounts]);
  const transactionsTableRef = useTableCardLabels(transactionsViewMode, [activeTransactions]);
  const cancelledTableRef = useTableCardLabels(cancelledViewMode, [cancelledTransactions]);
  const withdrawalsTableRef = useTableCardLabels(withdrawalsViewMode, [withdrawals]);
  const otherExpensesTableRef = useTableCardLabels(otherExpensesViewMode, [otherExpenses]);

  const isLoading =
    isLoadingAccounts ||
    isLoadingTransactions ||
    isLoadingWithdrawals ||
    isLoadingOtherExpenses ||
    isLoadingUsers;

  if (isLoading) {
    return <LoadingSpinner fullHeight />;
  }

  const accountOptions =
    accounts?.map((account) => ({
      value: account.id.toString(),
      label: `${account.name} (${formatCurrency(account.balance)})`,
    })) || [];

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case AccountType.CASH:
        return 'Наличные';
      case AccountType.BANK:
        return 'Банк';
      case AccountType.OTHER:
        return 'Прочее';
      default:
        return type;
    }
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    switch (type) {
      case TransactionType.PURCHASE:
        return 'Закупка';
      case TransactionType.SALE:
        return 'Продажа';
      case TransactionType.BUYBACK:
        return 'Выкуп';
      case TransactionType.WRITE_OFF:
        return 'Списание';
      case TransactionType.PARTNER_WITHDRAWAL:
        return 'Изъятие партнёра';
      default:
        return type;
    }
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={1} mb="xs">
              Финансы
            </Title>
            <Text c="dimmed">Управление счетами, транзакциями и изъятиями</Text>
          </div>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Общий баланс
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
                  Счетов
                </Text>
                <Text fw={700} size="xl">
                  {accounts?.length || 0}
                </Text>
              </div>
            </Group>
          </Paper>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Транзакций
                </Text>
                <Text fw={700} size="xl">
                  {activeTransactions.length}
                </Text>
                {cancelledTransactions.length > 0 && (
                  <Text c="dimmed" size="xs">
                    Отменено: {cancelledTransactions.length}
                  </Text>
                )}
              </div>
            </Group>
          </Paper>
          {cancelledTransactionsTotal !== 0 && (
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                    Сумма отмененных
                  </Text>
                  <Text fw={700} size="xl" c="red">
                    {formatCurrency(cancelledTransactionsTotal)}
                  </Text>
                </div>
              </Group>
            </Paper>
          )}
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  Изъятий
                </Text>
                <Text fw={700} size="xl">
                  {withdrawals?.length || 0}
                </Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="accounts"
              rightSection={
                <Badge size="sm" variant="filled" circle>
                  {accounts?.length || 0}
                </Badge>
              }
            >
              Счета
            </Tabs.Tab>
            <Tabs.Tab
              value="transactions"
              rightSection={
                <Badge size="sm" variant="filled" circle>
                  {activeTransactions.length}
                </Badge>
              }
            >
              Транзакции
            </Tabs.Tab>
            <Tabs.Tab
              value="cash-withdrawals"
              rightSection={
                <Badge size="sm" variant="filled" circle>
                  {withdrawals?.filter((w) => w.type === 'cash').length || 0}
                </Badge>
              }
            >
              Изъятие средств
            </Tabs.Tab>
            <Tabs.Tab
              value="goods-withdrawals"
              rightSection={
                <Badge size="sm" variant="filled" circle>
                  {withdrawals?.filter((w) => w.type === 'goods').length || 0}
                </Badge>
              }
            >
              Изъятие товара
            </Tabs.Tab>
            <Tabs.Tab
              value="other-expenses"
              rightSection={
                <Badge size="sm" variant="filled" circle>
                  {otherExpenses?.length || 0}
                </Badge>
              }
            >
              Прочие расходы
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="accounts" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Управление счетами</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAccountModalOpened(true)}
              >
                Создать счёт
              </Button>
            </Group>
            <Group justify="flex-end">
              <DataViewToggle value={accountsViewMode} onChange={setAccountsViewMode} />
            </Group>
            <Paper withBorder mt="sm">
              <Table
                ref={accountsTableRef}
                className="gc-data-table"
                data-view={accountsViewMode}
                striped
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Тип</Table.Th>
                    <Table.Th>Баланс</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {accounts?.map((account) => (
                    <Table.Tr key={account.id}>
                      <Table.Td>#{account.id}</Table.Td>
                      <Table.Td>{account.name}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {getAccountTypeLabel(account.type)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          fw={700}
                          c={Number(account.balance) >= 0 ? 'green' : 'red'}
                        >
                          {formatCurrency(account.balance)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Просмотр">
                            <ActionIcon
                              variant="subtle"
                              color="greenCycle"
                              onClick={() => {
                                setSelectedAccount(account);
                                setViewAccountModalOpened(true);
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => deleteAccountMutation.mutate(account.id)}
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
          </Tabs.Panel>

          <Tabs.Panel value="transactions" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Журнал транзакций</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setTransactionModalOpened(true)}
              >
                Создать транзакцию
              </Button>
            </Group>

            {/* Активные транзакции */}
            <Group justify="flex-end" mt="lg">
              <DataViewToggle value={transactionsViewMode} onChange={setTransactionsViewMode} />
            </Group>
            <Paper withBorder mt="sm" mb="md">
              <Table
                ref={transactionsTableRef}
                className="gc-data-table"
                data-view={transactionsViewMode}
                striped
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Счёт</Table.Th>
                    <Table.Th>Тип</Table.Th>
                    <Table.Th>Сумма</Table.Th>
                    <Table.Th>Описание</Table.Th>
                    <Table.Th>Дата</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activeTransactions.length > 0 ? (
                    activeTransactions.map((transaction) => (
                      <Table.Tr key={transaction.id}>
                        <Table.Td>#{transaction.id}</Table.Td>
                        <Table.Td>{transaction.account.name}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            fw={700}
                            c={Number(transaction.amount) >= 0 ? 'green' : 'red'}
                          >
                            {formatCurrency(transaction.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>{transaction.description || '-'}</Table.Td>
                        <Table.Td>{formatDateTime(transaction.createdAt)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Просмотр">
                              <ActionIcon
                                variant="subtle"
                                color="greenCycle"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setViewTransactionModalOpened(true);
                                }}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                        <Text c="dimmed" py="md">
                          Нет активных транзакций
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Отмененные транзакции */}
            {cancelledTransactions.length > 0 && (
              <>
                <Group justify="space-between" p="md">
                  <Text fw={600} c="dimmed">
                    Отмененные транзакции (не учитываются в балансе)
                  </Text>
                  <Badge color="red" variant="light">
                    Сумма: {formatCurrency(cancelledTransactionsTotal)}
                  </Badge>
                </Group>
                <Group justify="flex-end" mb="sm" px="md">
                  <DataViewToggle value={cancelledViewMode} onChange={setCancelledViewMode} />
                </Group>
                <Paper withBorder>
                  <Table
                    ref={cancelledTableRef}
                    className="gc-data-table"
                    data-view={cancelledViewMode}
                    striped
                    highlightOnHover
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Счёт</Table.Th>
                        <Table.Th>Тип</Table.Th>
                        <Table.Th>Сумма</Table.Th>
                        <Table.Th>Описание</Table.Th>
                        <Table.Th>Дата</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {cancelledTransactions.map((transaction) => (
                        <Table.Tr key={transaction.id} style={{ opacity: 0.6 }}>
                          <Table.Td>#{transaction.id}</Table.Td>
                          <Table.Td>{transaction.account.name}</Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="red">
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={700} c="dimmed">
                              {formatCurrency(transaction.amount)}
                            </Text>
                          </Table.Td>
                          <Table.Td>{transaction.description || '-'}</Table.Td>
                          <Table.Td>{formatDateTime(transaction.createdAt)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="cash-withdrawals" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Изъятия денежных средств</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  withdrawalForm.setFieldValue('type', 'cash');
                  setCashWithdrawalModalOpened(true);
                }}
              >
                Создать изъятие средств
              </Button>
            </Group>
            <Group justify="flex-end">
              <DataViewToggle value={withdrawalsViewMode} onChange={setWithdrawalsViewMode} />
            </Group>
            <Paper withBorder mt="sm">
              <Table
                ref={withdrawalsTableRef}
                className="gc-data-table"
                data-view={withdrawalsViewMode}
                striped
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Партнёр</Table.Th>
                    <Table.Th>Сумма</Table.Th>
                    <Table.Th>Счёт</Table.Th>
                    <Table.Th>Причина</Table.Th>
                    <Table.Th>Дата изъятия</Table.Th>
                    <Table.Th>Дата создания</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {withdrawals?.filter((w) => w.type === 'cash').map((withdrawal) => (
                    <Table.Tr key={withdrawal.id}>
                      <Table.Td>#{withdrawal.id}</Table.Td>
                      <Table.Td>{withdrawal.user.fullName}</Table.Td>
                      <Table.Td>{formatCurrency(withdrawal.amountOrQuantity)}</Table.Td>
                      <Table.Td>{withdrawal.account?.name || '-'}</Table.Td>
                      <Table.Td>{withdrawal.reason || '-'}</Table.Td>
                      <Table.Td>
                        {withdrawal.withdrawalDate
                          ? formatDate(new Date(withdrawal.withdrawalDate))
                          : '-'}
                      </Table.Td>
                      <Table.Td>{formatDate(withdrawal.createdAt)}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Просмотр">
                            <ActionIcon
                              variant="subtle"
                              color="greenCycle"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setViewWithdrawalModalOpened(true);
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                deleteWithdrawalMutation.mutate(withdrawal.id)
                              }
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
          </Tabs.Panel>

          <Tabs.Panel value="goods-withdrawals" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Изъятия товара</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  withdrawalForm.setFieldValue('type', 'goods');
                  setGoodsWithdrawalModalOpened(true);
                }}
              >
                Создать изъятие товара
              </Button>
            </Group>
            <Group justify="flex-end">
              <DataViewToggle value={withdrawalsViewMode} onChange={setWithdrawalsViewMode} />
            </Group>
            <Paper withBorder mt="sm">
              <Table
                ref={withdrawalsTableRef}
                className="gc-data-table"
                data-view={withdrawalsViewMode}
                striped
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Партнёр</Table.Th>
                    <Table.Th>Количество</Table.Th>
                    <Table.Th>Стоимость</Table.Th>
                    <Table.Th>Поставка</Table.Th>
                    <Table.Th>Причина</Table.Th>
                    <Table.Th>Дата изъятия</Table.Th>
                    <Table.Th>Дата создания</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {withdrawals?.filter((w) => w.type === 'goods').map((withdrawal) => (
                    <Table.Tr key={withdrawal.id}>
                      <Table.Td>#{withdrawal.id}</Table.Td>
                      <Table.Td>{withdrawal.user.fullName}</Table.Td>
                      <Table.Td>{withdrawal.amountOrQuantity} шт</Table.Td>
                      <Table.Td>
                        {withdrawal.costValue
                          ? formatCurrency(withdrawal.costValue)
                          : '-'}
                      </Table.Td>
                      <Table.Td>
                        {withdrawal.shipment
                          ? `#${withdrawal.shipment.id} - ${withdrawal.shipment.supplier.name}`
                          : '-'}
                      </Table.Td>
                      <Table.Td>{withdrawal.reason || '-'}</Table.Td>
                      <Table.Td>
                        {withdrawal.withdrawalDate
                          ? formatDate(new Date(withdrawal.withdrawalDate))
                          : '-'}
                      </Table.Td>
                      <Table.Td>{formatDate(withdrawal.createdAt)}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Просмотр">
                            <ActionIcon
                              variant="subtle"
                              color="greenCycle"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setViewWithdrawalModalOpened(true);
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Удалить">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                deleteWithdrawalMutation.mutate(withdrawal.id)
                              }
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
          </Tabs.Panel>

          <Tabs.Panel value="other-expenses" pt="md">
            <Group justify="space-between" mb="md">
              <Text c="dimmed">Прочие расходы на бизнес</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setOtherExpenseModalOpened(true)}
              >
                Создать расход
              </Button>
            </Group>
            <Group justify="flex-end">
              <DataViewToggle
                value={otherExpensesViewMode}
                onChange={setOtherExpensesViewMode}
              />
            </Group>
            <Paper withBorder mt="sm">
              <Table
                ref={otherExpensesTableRef}
                className="gc-data-table"
                data-view={otherExpensesViewMode}
                striped
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Счёт</Table.Th>
                    <Table.Th>Категория</Table.Th>
                    <Table.Th>Сумма</Table.Th>
                    <Table.Th>Описание</Table.Th>
                    <Table.Th>Дата расхода</Table.Th>
                    <Table.Th>Дата создания</Table.Th>
                    <Table.Th>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {otherExpenses && otherExpenses.length > 0 ? (
                    otherExpenses.map((expense) => (
                      <Table.Tr key={expense.id}>
                        <Table.Td>#{expense.id}</Table.Td>
                        <Table.Td>{expense.account.name}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{expense.category}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} c="red">
                            {formatCurrency(expense.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>{expense.description || '-'}</Table.Td>
                        <Table.Td>
                          {expense.expenseDate ? formatDate(expense.expenseDate) : '-'}
                        </Table.Td>
                        <Table.Td>{formatDateTime(expense.createdAt)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Удалить">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => deleteOtherExpenseMutation.mutate(expense.id)}
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
                      <Table.Td colSpan={8} style={{ textAlign: 'center' }}>
                        <Text c="dimmed" py="md">
                          Нет прочих расходов
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <MantineModal
          opened={accountModalOpened}
          onClose={() => {
            setAccountModalOpened(false);
            accountForm.reset();
          }}
          title="Создать счёт"
          centered
        >
          <form onSubmit={accountForm.onSubmit((values) => createAccountMutation.mutate(values))}>
            <Stack>
              <TextInput
                label="Название"
                required
                {...accountForm.getInputProps('name')}
              />
              <Select
                label="Тип"
                required
                data={[
                  { value: AccountType.CASH, label: 'Наличные' },
                  { value: AccountType.BANK, label: 'Банк' },
                  { value: AccountType.OTHER, label: 'Прочее' },
                ]}
                {...accountForm.getInputProps('type')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setAccountModalOpened(false);
                    accountForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createAccountMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={transactionModalOpened}
          onClose={() => {
            setTransactionModalOpened(false);
            transactionForm.reset();
          }}
          title="Создать транзакцию"
          centered
          size="lg"
        >
          <form
            onSubmit={transactionForm.onSubmit((values) =>
              createTransactionMutation.mutate(values),
            )}
          >
            <Stack>
              <Select
                label="Счёт"
                required
                data={accountOptions}
                searchable
                placeholder="Выберите счёт"
                value={transactionForm.values.accountId.toString()}
                onChange={(value) =>
                  transactionForm.setFieldValue('accountId', value ? parseInt(value) : 0)
                }
                error={transactionForm.errors.accountId}
              />
              <NumberInput
                label="Сумма"
                required
                decimalScale={2}
                {...transactionForm.getInputProps('amount')}
              />
              <Select
                label="Тип"
                required
                data={[
                  { value: TransactionType.PURCHASE, label: 'Закупка' },
                  { value: TransactionType.SALE, label: 'Продажа' },
                  { value: TransactionType.BUYBACK, label: 'Выкуп' },
                  { value: TransactionType.WRITE_OFF, label: 'Списание' },
                  {
                    value: TransactionType.PARTNER_WITHDRAWAL,
                    label: 'Изъятие партнёра',
                  },
                ]}
                {...transactionForm.getInputProps('type')}
              />
              <Textarea
                label="Описание"
                rows={3}
                {...transactionForm.getInputProps('description')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setTransactionModalOpened(false);
                    transactionForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createTransactionMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        {/* Модальное окно создания изъятия средств */}
        <MantineModal
          opened={cashWithdrawalModalOpened}
          onClose={() => {
            setCashWithdrawalModalOpened(false);
            withdrawalForm.reset();
          }}
          title="Создать изъятие средств"
          centered
          size="lg"
        >
          <form
            onSubmit={withdrawalForm.onSubmit((values) => {
              createWithdrawalMutation.mutate({ ...values, type: 'cash' });
            })}
          >
            <Stack>
              <Select
                label="Пользователь"
                required
                data={superAdminOptions}
                searchable
                placeholder="Выберите супер-администратора"
                value={withdrawalForm.values.userId?.toString() || ''}
                onChange={(value) =>
                  withdrawalForm.setFieldValue('userId', value ? parseInt(value) : 0)
                }
                error={withdrawalForm.errors.userId}
              />
              <Select
                label="Счёт"
                required
                data={accountOptions}
                searchable
                placeholder="Выберите счёт"
                value={withdrawalForm.values.accountId?.toString() || ''}
                onChange={(value) =>
                  withdrawalForm.setFieldValue('accountId', value ? parseInt(value) : 0)
                }
                error={withdrawalForm.errors.accountId}
              />
              <TextInput
                label="Сумма"
                required
                type="number"
                step="0.01"
                {...withdrawalForm.getInputProps('amountOrQuantity')}
              />
              <Textarea
                label="Причина"
                required
                rows={3}
                {...withdrawalForm.getInputProps('reason')}
              />
              <TextInput
                type="date"
                label="Дата изъятия"
                {...withdrawalForm.getInputProps('withdrawalDate')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setCashWithdrawalModalOpened(false);
                    withdrawalForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createWithdrawalMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        {/* Модальное окно создания изъятия товара */}
        <MantineModal
          opened={goodsWithdrawalModalOpened}
          onClose={() => {
            setGoodsWithdrawalModalOpened(false);
            withdrawalForm.reset();
          }}
          title="Создать изъятие товара"
          centered
          size="lg"
        >
          <form
            onSubmit={withdrawalForm.onSubmit((values) => {
              createWithdrawalMutation.mutate({ ...values, type: 'goods' });
            })}
          >
            <Stack>
              <Select
                label="Пользователь"
                required
                data={superAdminOptions}
                searchable
                placeholder="Выберите супер-администратора"
                value={withdrawalForm.values.userId?.toString() || ''}
                onChange={(value) =>
                  withdrawalForm.setFieldValue('userId', value ? parseInt(value) : 0)
                }
                error={withdrawalForm.errors.userId}
              />
              <Select
                label="Поставка"
                required
                data={
                  shipments?.map((shipment) => ({
                    value: shipment.id.toString(),
                    label: `#${shipment.id} - ${shipment.supplier.name} (${formatDate(shipment.arrivalDate)})`,
                  })) || []
                }
                searchable
                placeholder="Выберите поставку"
                value={withdrawalForm.values.shipmentId?.toString() || ''}
                onChange={(value) => {
                  withdrawalForm.setFieldValue('shipmentId', value ? parseInt(value) : 0);
                  // Очищаем количество и стоимость при смене поставки
                  withdrawalForm.setFieldValue('amountOrQuantity', '');
                  withdrawalForm.setFieldValue('costValue', '');
                }}
                error={withdrawalForm.errors.shipmentId}
                disabled={isLoadingShipments}
              />
              <TextInput
                label="Количество"
                required
                type="number"
                step="0.01"
                {...withdrawalForm.getInputProps('amountOrQuantity')}
              />
              <NumberInput
                label="Стоимость"
                decimalScale={2}
                readOnly
                {...withdrawalForm.getInputProps('costValue')}
              />
              <Textarea
                label="Причина"
                required
                rows={3}
                {...withdrawalForm.getInputProps('reason')}
              />
              <TextInput
                type="date"
                label="Дата изъятия"
                {...withdrawalForm.getInputProps('withdrawalDate')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setGoodsWithdrawalModalOpened(false);
                    withdrawalForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createWithdrawalMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        <MantineModal
          opened={otherExpenseModalOpened}
          onClose={() => {
            setOtherExpenseModalOpened(false);
            otherExpenseForm.reset();
          }}
          title="Создать прочий расход"
          centered
          size="lg"
        >
          <form
            onSubmit={otherExpenseForm.onSubmit((values) =>
              createOtherExpenseMutation.mutate(values),
            )}
          >
            <Stack>
              <Select
                label="Счёт"
                required
                data={accountOptions}
                searchable
                placeholder="Выберите счёт"
                value={otherExpenseForm.values.accountId.toString()}
                onChange={(value) =>
                  otherExpenseForm.setFieldValue('accountId', value ? parseInt(value) : 0)
                }
                error={otherExpenseForm.errors.accountId}
              />
              <NumberInput
                label="Сумма"
                required
                decimalScale={2}
                min={0.01}
                {...otherExpenseForm.getInputProps('amount')}
              />
              <TextInput
                label="Категория"
                required
                placeholder="Например: Аренда, Коммунальные услуги, Реклама"
                {...otherExpenseForm.getInputProps('category')}
              />
              <Textarea
                label="Описание"
                rows={3}
                placeholder="Дополнительная информация о расходе"
                {...otherExpenseForm.getInputProps('description')}
              />
              <TextInput
                type="date"
                label="Дата расхода"
                {...otherExpenseForm.getInputProps('expenseDate')}
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setOtherExpenseModalOpened(false);
                    otherExpenseForm.reset();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={createOtherExpenseMutation.isPending}>
                  Создать
                </Button>
              </Group>
            </Stack>
          </form>
        </MantineModal>

        {/* Модальное окно просмотра транзакции */}
        <MantineModal
          opened={viewTransactionModalOpened}
          onClose={() => {
            setViewTransactionModalOpened(false);
            setSelectedTransaction(null);
          }}
          title={`Транзакция #${selectedTransaction?.id || transactionDetails?.id || ''}`}
          centered
          size="lg"
        >
          {(transactionDetails || selectedTransaction) && (
            <Stack gap="md">
              {(() => {
                const transaction = transactionDetails || selectedTransaction!;
                return (
                  <>
                    <Group>
                      <Text fw={600}>ID:</Text>
                      <Text>#{transaction.id}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Счёт:</Text>
                      <Text>{transaction.account.name}</Text>
                      <Badge variant="light">
                        {getAccountTypeLabel(transaction.account.type)}
                      </Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Тип транзакции:</Text>
                      <Badge
                        variant="light"
                        color={transaction.isCancelled ? 'red' : undefined}
                      >
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Сумма:</Text>
                      <Text
                        fw={700}
                        size="lg"
                        c={Number(transaction.amount) >= 0 ? 'green' : 'red'}
                      >
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </Group>

                    {transaction.description && (
                      <Stack gap="xs">
                        <Text fw={600}>Описание:</Text>
                        <Text style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {transaction.description}
                        </Text>
                      </Stack>
                    )}

                    <Group>
                      <Text fw={600}>Статус:</Text>
                      <Badge color={transaction.isCancelled ? 'red' : 'green'} variant="light">
                        {transaction.isCancelled ? 'Отменена' : 'Активна'}
                      </Badge>
                    </Group>

                    {transaction.linkedEntityId && transaction.linkedEntityType && (
                      <>
                        <Group>
                          <Text fw={600}>Связанная сущность:</Text>
                          <Text>
                            {transaction.linkedEntityType === 'sale' && 'Продажа'}
                            {transaction.linkedEntityType === 'shipment' && 'Поставка'}
                            {transaction.linkedEntityType === 'buyback' && 'Выкуп'}
                            {transaction.linkedEntityType === 'write_off' && 'Списание'}
                            {transaction.linkedEntityType === 'partner_withdrawal' &&
                              'Изъятие партнёра'}
                            {!['sale', 'shipment', 'buyback', 'write_off', 'partner_withdrawal'].includes(
                              transaction.linkedEntityType,
                            ) && transaction.linkedEntityType}
                          </Text>
                          <Text c="dimmed">#{transaction.linkedEntityId}</Text>
                        </Group>
                      </>
                    )}

                    {/* Информация о связанной продаже */}
                    {transaction.sale && (
                      <div>
                        <Text fw={600} mb="xs">
                          Связанная продажа:
                        </Text>
                        <Table>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>ID</Table.Th>
                              <Table.Th>Клиент</Table.Th>
                              <Table.Th>Дата</Table.Th>
                              <Table.Th>Сумма</Table.Th>
                              <Table.Th>Статус</Table.Th>
                              <Table.Th>Товаров</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            <Table.Tr>
                              <Table.Td>#{transaction.sale.id}</Table.Td>
                              <Table.Td>{transaction.sale.client.fullName}</Table.Td>
                              <Table.Td>{formatDate(transaction.sale.saleDate)}</Table.Td>
                              <Table.Td>
                                <Text fw={700}>
                                  {formatCurrency(transaction.sale.totalAmount)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={transaction.sale.status === 'completed' ? 'green' : 'red'}
                                  variant="light"
                                >
                                  {transaction.sale.status === 'completed' ? 'Завершена' : 'Отменена'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>{transaction.sale.items.length}</Table.Td>
                            </Table.Tr>
                          </Table.Tbody>
                        </Table>

                        {transaction.sale.items.length > 0 && (
                          <div style={{ marginTop: 'var(--mantine-spacing-md)' }}>
                            <Text fw={600} mb="xs" size="sm">
                              Товары в продаже:
                            </Text>
                            <Table size="sm">
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Партия</Table.Th>
                                  <Table.Th>Количество</Table.Th>
                                  <Table.Th>Цена за единицу</Table.Th>
                                  <Table.Th>Сумма</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {transaction.sale.items.map((item) => (
                                  <Table.Tr key={item.id}>
                                    <Table.Td>
                                      {item.batch.plantType} ({item.batch.sizeCmMin}-
                                      {item.batch.sizeCmMax}см, {item.batch.potType})
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
                        )}

                        <Group justify="space-between" mt="xs">
                          <Text c="dimmed" size="xs">
                            Создано: {formatDate(transaction.sale.createdAt)}
                          </Text>
                          {transaction.sale.updatedAt !== transaction.sale.createdAt && (
                            <Text c="dimmed" size="xs">
                              Обновлено: {formatDate(transaction.sale.updatedAt)}
                            </Text>
                          )}
                        </Group>
                      </div>
                    )}

                    <div>
                      <Text c="dimmed" size="sm">
                        Создано: {formatDateTime(transaction.createdAt)}
                      </Text>
                      {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                        <Text c="dimmed" size="sm">
                          Обновлено: {formatDateTime(transaction.updatedAt)}
                        </Text>
                      )}
                    </div>
                  </>
                );
              })()}
            </Stack>
          )}
        </MantineModal>

        {/* Модальное окно просмотра изъятия */}
        <MantineModal
          opened={viewWithdrawalModalOpened}
          onClose={() => {
            setViewWithdrawalModalOpened(false);
            setSelectedWithdrawal(null);
          }}
          title={`Изъятие #${selectedWithdrawal?.id || withdrawalDetails?.id || ''}`}
          centered
          size="lg"
        >
          {(withdrawalDetails || selectedWithdrawal) && (
            <Stack gap="md">
              {(() => {
                const withdrawal = withdrawalDetails || selectedWithdrawal!;
                return (
                  <>
                    <Group>
                      <Text fw={600}>ID:</Text>
                      <Text>#{withdrawal.id}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Партнёр:</Text>
                      <Text>{withdrawal.user.fullName}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Тип изъятия:</Text>
                      <Badge variant="light">
                        {withdrawal.type === 'cash' ? 'Деньги' : 'Товар'}
                      </Badge>
                    </Group>

                    {withdrawal.account && (
                      <Group>
                        <Text fw={600}>Счёт:</Text>
                        <Text>{withdrawal.account.name}</Text>
                        <Badge variant="light">
                          {getAccountTypeLabel(withdrawal.account.type)}
                        </Badge>
                      </Group>
                    )}

                    <Group>
                      <Text fw={600}>
                        {withdrawal.type === 'cash' ? 'Сумма' : 'Количество'}:
                      </Text>
                      <Text fw={700} size="lg">
                        {withdrawal.type === 'cash'
                          ? formatCurrency(withdrawal.amountOrQuantity)
                          : `${withdrawal.amountOrQuantity} шт`}
                      </Text>
                    </Group>

                    {withdrawal.costValue && (
                      <Group>
                        <Text fw={600}>Стоимость:</Text>
                        <Text fw={700} size="lg" c="green">
                          {formatCurrency(withdrawal.costValue)}
                        </Text>
                      </Group>
                    )}

                    {withdrawal.shipment && (
                      <Group>
                        <Text fw={600}>Поставка:</Text>
                        <Text>
                          #{withdrawal.shipment.id} - {withdrawal.shipment.supplier.name}
                        </Text>
                        <Text c="dimmed" size="sm">
                          ({formatDate(withdrawal.shipment.arrivalDate)})
                        </Text>
                      </Group>
                    )}

                    {withdrawal.reason && (
                      <Stack gap="xs">
                        <Text fw={600}>Причина:</Text>
                        <Text style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {withdrawal.reason}
                        </Text>
                      </Stack>
                    )}

                    <Group>
                      <Text fw={600}>Дата изъятия:</Text>
                      <Text>
                        {withdrawal.withdrawalDate
                          ? formatDate(new Date(withdrawal.withdrawalDate))
                          : 'Не указана'}
                      </Text>
                    </Group>

                    <div>
                      <Text c="dimmed" size="sm">
                        Создано: {formatDateTime(withdrawal.createdAt)}
                      </Text>
                    </div>
                  </>
                );
              })()}
            </Stack>
          )}
        </MantineModal>

        {/* Модальное окно просмотра счета */}
        <MantineModal
          opened={viewAccountModalOpened}
          onClose={() => {
            setViewAccountModalOpened(false);
            setSelectedAccount(null);
          }}
          title={`Счёт #${selectedAccount?.id || accountDetails?.id || ''}`}
          centered
          size="lg"
        >
          {(accountDetails || selectedAccount) && (
            <Stack gap="md">
              {(() => {
                const account = accountDetails || selectedAccount!;
                const accountTransactions = account.transactions || [];
                const activeTransactions = accountTransactions.filter((t) => !t.isCancelled);
                const cancelledTransactions = accountTransactions.filter((t) => t.isCancelled);

                return (
                  <>
                    <Group>
                      <Text fw={600}>ID:</Text>
                      <Text>#{account.id}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Название:</Text>
                      <Text>{account.name}</Text>
                    </Group>

                    <Group>
                      <Text fw={600}>Тип счёта:</Text>
                      <Badge variant="light">
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                    </Group>

                    <Group>
                      <Text fw={600}>Баланс:</Text>
                      <Text
                        fw={700}
                        size="lg"
                        c={Number(account.balance) >= 0 ? 'green' : 'red'}
                      >
                        {formatCurrency(account.balance)}
                      </Text>
                    </Group>

                    {accountTransactions.length > 0 && (
                      <>
                        <Divider label="Транзакции" labelPosition="center" />

                        {activeTransactions.length > 0 && (
                          <div>
                            <Text fw={600} mb="xs">
                              Активные транзакции ({activeTransactions.length})
                            </Text>
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                              <Table striped highlightOnHover style={{ minWidth: '600px' }}>
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>ID</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Тип</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Сумма</Table.Th>
                                    <Table.Th style={{ minWidth: '200px' }}>Описание</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Дата</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {activeTransactions.map((transaction) => (
                                    <Table.Tr key={transaction.id}>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        #{transaction.id}
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Badge variant="light">
                                          {getTransactionTypeLabel(transaction.type)}
                                        </Badge>
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Text
                                          fw={700}
                                          c={Number(transaction.amount) >= 0 ? 'green' : 'red'}
                                        >
                                          {formatCurrency(transaction.amount)}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Text
                                          style={{
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                          }}
                                        >
                                          {transaction.description || '-'}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        {formatDateTime(transaction.createdAt)}
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {cancelledTransactions.length > 0 && (
                          <div>
                            <Text fw={600} mb="xs" c="dimmed">
                              Отмененные транзакции ({cancelledTransactions.length})
                            </Text>
                            <div style={{ overflowX: 'auto', width: '100%' }}>
                              <Table striped highlightOnHover style={{ minWidth: '600px' }}>
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>ID</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Тип</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Сумма</Table.Th>
                                    <Table.Th style={{ minWidth: '200px' }}>Описание</Table.Th>
                                    <Table.Th style={{ whiteSpace: 'nowrap' }}>Дата</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {cancelledTransactions.map((transaction) => (
                                    <Table.Tr key={transaction.id} style={{ opacity: 0.6 }}>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        #{transaction.id}
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Badge variant="light" color="red">
                                          {getTransactionTypeLabel(transaction.type)}
                                        </Badge>
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Text fw={700} c="dimmed">
                                          {formatCurrency(transaction.amount)}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td>
                                        <Text
                                          style={{
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                          }}
                                        >
                                          {transaction.description || '-'}
                                        </Text>
                                      </Table.Td>
                                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        {formatDateTime(transaction.createdAt)}
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {accountTransactions.length === 0 && (
                      <Text c="dimmed" ta="center" py="md">
                        Нет транзакций
                      </Text>
                    )}

                    <div>
                      <Text c="dimmed" size="sm">
                        Создано: {formatDateTime(account.createdAt)}
                      </Text>
                      {account.updatedAt && account.updatedAt !== account.createdAt && (
                        <Text c="dimmed" size="sm">
                          Обновлено: {formatDateTime(account.updatedAt)}
                        </Text>
                      )}
                    </div>
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
