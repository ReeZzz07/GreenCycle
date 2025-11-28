import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, Badge, ActionIcon, Tooltip, Modal as MantineModal, SimpleGrid, Tabs, Select, NumberInput, TextInput, Textarea, Divider, } from '@mantine/core';
import { IconPlus, IconEye, IconTrash, IconCurrencyDollar, } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { financeService } from '../services/finance.service';
import { usersService } from '../services/users.service';
import { shipmentsService } from '../services/shipments.service';
import { AccountType, TransactionType, } from '../types/finance';
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
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [viewWithdrawalModalOpened, setViewWithdrawalModalOpened] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [viewAccountModalOpened, setViewAccountModalOpened] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [activeTab, setActiveTab] = useState('accounts');
    const [accountsViewMode, setAccountsViewMode] = useLocalStorage({
        key: 'finance-accounts-view-mode',
        defaultValue: 'table',
    });
    const [transactionsViewMode, setTransactionsViewMode] = useLocalStorage({
        key: 'finance-transactions-view-mode',
        defaultValue: 'table',
    });
    const [cancelledViewMode, setCancelledViewMode] = useLocalStorage({
        key: 'finance-cancelled-view-mode',
        defaultValue: 'table',
    });
    const [withdrawalsViewMode, setWithdrawalsViewMode] = useLocalStorage({
        key: 'finance-withdrawals-view-mode',
        defaultValue: 'table',
    });
    const [otherExpensesViewMode, setOtherExpensesViewMode] = useLocalStorage({
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
        queryFn: () => financeService.getTransactionById(selectedTransaction.id),
        enabled: !!selectedTransaction && viewTransactionModalOpened,
    });
    // Загрузка детальной информации об изъятии
    const { data: withdrawalDetails } = useQuery({
        queryKey: ['partnerWithdrawal', selectedWithdrawal?.id],
        queryFn: () => financeService.getPartnerWithdrawalById(selectedWithdrawal.id),
        enabled: !!selectedWithdrawal && viewWithdrawalModalOpened,
    });
    // Загрузка детальной информации о счете
    const { data: accountDetails } = useQuery({
        queryKey: ['account', selectedAccount?.id],
        queryFn: () => financeService.getAccountById(selectedAccount.id),
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
    const accountForm = useForm({
        initialValues: {
            name: '',
            type: AccountType.CASH,
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : 'Укажите название'),
        },
    });
    const transactionForm = useForm({
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
    const [withdrawalUserId, setWithdrawalUserId] = useState(0);
    const withdrawalForm = useForm({
        initialValues: {
            type: 'cash',
            amountOrQuantity: '',
            costValue: '',
            reason: '',
            accountId: 0,
            withdrawalDate: '',
            shipmentId: 0,
        },
        validate: {
            amountOrQuantity: (value) => value.trim().length > 0 ? null : 'Укажите сумму или количество',
            reason: (value) => (value.trim().length > 0 ? null : 'Укажите причину'),
            accountId: (value, values) => values.type === 'cash' && (!value || value === 0)
                ? 'Выберите счёт'
                : null,
            shipmentId: (value, values) => values.type === 'goods' && (!value || value === 0)
                ? 'Выберите поставку'
                : null,
        },
    });
    const otherExpenseForm = useForm({
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
        if (goodsWithdrawalModalOpened &&
            withdrawalForm.values.shipmentId &&
            withdrawalForm.values.amountOrQuantity) {
            const selectedShipment = shipments?.find((s) => s.id === withdrawalForm.values.shipmentId);
            if (selectedShipment && selectedShipment.batches) {
                // Рассчитываем общее количество товаров в поставке
                const totalQuantity = selectedShipment.batches.reduce((sum, batch) => sum + batch.quantityInitial, 0);
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
        mutationFn: (dto) => financeService.createAccount(dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать счёт',
                color: 'red',
            });
        },
    });
    const createTransactionMutation = useMutation({
        mutationFn: (dto) => financeService.createTransaction(dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать транзакцию',
                color: 'red',
            });
        },
    });
    const createWithdrawalMutation = useMutation({
        mutationFn: (dto) => {
            // Преобразуем данные для отправки на бэкенд
            const payload = {
                type: dto.type,
                amountOrQuantity: parseFloat(dto.amountOrQuantity) || 0,
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
                payload.costValue = parseFloat(dto.costValue) || undefined;
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать изъятие',
                color: 'red',
            });
        },
    });
    const deleteAccountMutation = useMutation({
        mutationFn: (id) => financeService.deleteAccount(id),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить счёт',
                color: 'red',
            });
        },
    });
    const createOtherExpenseMutation = useMutation({
        mutationFn: (dto) => financeService.createOtherExpense(dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать прочий расход',
                color: 'red',
            });
        },
    });
    const deleteOtherExpenseMutation = useMutation({
        mutationFn: (id) => financeService.deleteOtherExpense(id),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить прочий расход',
                color: 'red',
            });
        },
    });
    const deleteWithdrawalMutation = useMutation({
        mutationFn: (id) => financeService.deletePartnerWithdrawal(id),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить изъятие',
                color: 'red',
            });
        },
    });
    const deleteTransactionMutation = useMutation({
        mutationFn: (id) => financeService.deleteTransaction(id),
        onSuccess: (response) => {
            if (response?.data?.cancelled) {
                notifications.show({
                    title: 'Успешно',
                    message: 'Транзакция помечена как отмененная (связана с отмененной продажей)',
                    color: 'blue',
                });
            }
            else {
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
        onError: (error) => {
            // Извлекаем сообщение об ошибке из ответа сервера
            let errorMessage = 'Не удалось удалить транзакцию';
            if (error.response?.data?.error) {
                // Если есть объект error в ответе
                if (typeof error.response.data.error === 'string') {
                    errorMessage = error.response.data.error;
                }
                else if (error.response.data.error.message) {
                    errorMessage = error.response.data.error.message;
                }
                else if (Array.isArray(error.response.data.error.message)) {
                    // Если message - массив (validation errors)
                    errorMessage = error.response.data.error.message.join(', ');
                }
            }
            else if (error.response?.data?.message) {
                // Если сообщение на верхнем уровне
                if (typeof error.response.data.message === 'string') {
                    errorMessage = error.response.data.message;
                }
                else if (Array.isArray(error.response.data.message)) {
                    errorMessage = error.response.data.message.join(', ');
                }
            }
            else if (error.message) {
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
        mutationFn: ({ id, isCancelled }) => financeService.updateTransactionStatus(id, isCancelled),
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
                setSelectedTransaction((prev) => prev ? { ...prev, isCancelled: variables.isCancelled } : null);
            }
        },
        onError: (error) => {
            let errorMessage = 'Не удалось изменить статус транзакции';
            if (error.response?.data?.error) {
                if (typeof error.response.data.error === 'string') {
                    errorMessage = error.response.data.error;
                }
                else if (error.response.data.error.message) {
                    errorMessage = error.response.data.error.message;
                }
                else if (Array.isArray(error.response.data.error.message)) {
                    errorMessage = error.response.data.error.message.join(', ');
                }
            }
            else if (error.response?.data?.message) {
                if (typeof error.response.data.message === 'string') {
                    errorMessage = error.response.data.message;
                }
                else if (Array.isArray(error.response.data.message)) {
                    errorMessage = error.response.data.message.join(', ');
                }
            }
            else if (error.message) {
                errorMessage = error.message;
            }
            notifications.show({
                title: 'Ошибка',
                message: errorMessage,
                color: 'red',
            });
        },
    });
    const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;
    // Разделяем транзакции на активные и отмененные
    const activeTransactions = transactions?.filter((t) => !t.isCancelled) || [];
    const cancelledTransactions = transactions?.filter((t) => t.isCancelled) || [];
    const cancelledTransactionsTotal = cancelledTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const accountsTableRef = useTableCardLabels(accountsViewMode, [accounts]);
    const transactionsTableRef = useTableCardLabels(transactionsViewMode, [activeTransactions]);
    const cancelledTableRef = useTableCardLabels(cancelledViewMode, [cancelledTransactions]);
    const withdrawalsTableRef = useTableCardLabels(withdrawalsViewMode, [withdrawals]);
    const otherExpensesTableRef = useTableCardLabels(otherExpensesViewMode, [otherExpenses]);
    const isLoading = isLoadingAccounts ||
        isLoadingTransactions ||
        isLoadingWithdrawals ||
        isLoadingOtherExpenses ||
        isLoadingUsers;
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    const accountOptions = accounts?.map((account) => ({
        value: account.id.toString(),
        label: `${account.name} (${formatCurrency(account.balance)})`,
    })) || [];
    const getAccountTypeLabel = (type) => {
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
    const getTransactionTypeLabel = (type) => {
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
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u0424\u0438\u043D\u0430\u043D\u0441\u044B" }), _jsx(Text, { c: "dimmed", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0447\u0435\u0442\u0430\u043C\u0438, \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F\u043C\u0438 \u0438 \u0438\u0437\u044A\u044F\u0442\u0438\u044F\u043C\u0438" })] }) }), _jsxs(SimpleGrid, { cols: { base: 1, sm: 2, lg: 4 }, spacing: "md", children: [_jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u041E\u0431\u0449\u0438\u0439 \u0431\u0430\u043B\u0430\u043D\u0441" }), _jsx(Text, { fw: 700, size: "xl", children: formatCurrency(totalBalance) })] }), _jsx(IconCurrencyDollar, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0421\u0447\u0435\u0442\u043E\u0432" }), _jsx(Text, { fw: 700, size: "xl", children: accounts?.length || 0 })] }) }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439" }), _jsx(Text, { fw: 700, size: "xl", children: activeTransactions.length }), cancelledTransactions.length > 0 && (_jsxs(Text, { c: "dimmed", size: "xs", children: ["\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E: ", cancelledTransactions.length] }))] }) }) }), cancelledTransactionsTotal !== 0 && (_jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0421\u0443\u043C\u043C\u0430 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043D\u044B\u0445" }), _jsx(Text, { fw: 700, size: "xl", c: "red", children: formatCurrency(cancelledTransactionsTotal) })] }) }) })), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0418\u0437\u044A\u044F\u0442\u0438\u0439" }), _jsx(Text, { fw: 700, size: "xl", children: withdrawals?.length || 0 })] }) }) })] }), _jsxs(Tabs, { value: activeTab, onChange: setActiveTab, children: [_jsxs(Tabs.List, { children: [_jsx(Tabs.Tab, { value: "accounts", rightSection: _jsx(Badge, { size: "sm", variant: "filled", circle: true, children: accounts?.length || 0 }), children: "\u0421\u0447\u0435\u0442\u0430" }), _jsx(Tabs.Tab, { value: "transactions", rightSection: _jsx(Badge, { size: "sm", variant: "filled", circle: true, children: activeTransactions.length }), children: "\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438" }), _jsx(Tabs.Tab, { value: "cash-withdrawals", rightSection: _jsx(Badge, { size: "sm", variant: "filled", circle: true, children: withdrawals?.filter((w) => w.type === 'cash').length || 0 }), children: "\u0418\u0437\u044A\u044F\u0442\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }), _jsx(Tabs.Tab, { value: "goods-withdrawals", rightSection: _jsx(Badge, { size: "sm", variant: "filled", circle: true, children: withdrawals?.filter((w) => w.type === 'goods').length || 0 }), children: "\u0418\u0437\u044A\u044F\u0442\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u0430" }), _jsx(Tabs.Tab, { value: "other-expenses", rightSection: _jsx(Badge, { size: "sm", variant: "filled", circle: true, children: otherExpenses?.length || 0 }), children: "\u041F\u0440\u043E\u0447\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B" })] }), _jsxs(Tabs.Panel, { value: "accounts", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0447\u0435\u0442\u0430\u043C\u0438" }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setAccountModalOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0447\u0451\u0442" })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: accountsViewMode, onChange: setAccountsViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: accountsTableRef, className: "gc-data-table", "data-view": accountsViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u0411\u0430\u043B\u0430\u043D\u0441" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: accounts?.map((account) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", account.id] }), _jsx(Table.Td, { children: account.name }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", children: getAccountTypeLabel(account.type) }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: Number(account.balance) >= 0 ? 'green' : 'red', children: formatCurrency(account.balance) }) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                                setSelectedAccount(account);
                                                                                setViewAccountModalOpened(true);
                                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteAccountMutation.mutate(account.id), children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, account.id))) })] }) })] }), _jsxs(Tabs.Panel, { value: "transactions", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439" }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setTransactionModalOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044E" })] }), _jsx(Group, { justify: "flex-end", mt: "lg", children: _jsx(DataViewToggle, { value: transactionsViewMode, onChange: setTransactionsViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", mb: "md", children: _jsxs(Table, { ref: transactionsTableRef, className: "gc-data-table", "data-view": transactionsViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: activeTransactions.length > 0 ? (activeTransactions.map((transaction) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", transaction.id] }), _jsx(Table.Td, { children: transaction.account.name }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", children: getTransactionTypeLabel(transaction.type) }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: Number(transaction.amount) >= 0 ? 'green' : 'red', children: formatCurrency(transaction.amount) }) }), _jsx(Table.Td, { children: transaction.description || '-' }), _jsx(Table.Td, { children: formatDateTime(transaction.createdAt) }), _jsx(Table.Td, { children: _jsx(Group, { gap: "xs", children: _jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                            setSelectedTransaction(transaction);
                                                                            setViewTransactionModalOpened(true);
                                                                        }, children: _jsx(IconEye, { size: 16 }) }) }) }) })] }, transaction.id)))) : (_jsx(Table.Tr, { children: _jsx(Table.Td, { colSpan: 7, style: { textAlign: 'center' }, children: _jsx(Text, { c: "dimmed", py: "md", children: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439" }) }) })) })] }) }), cancelledTransactions.length > 0 && (_jsxs(_Fragment, { children: [_jsxs(Group, { justify: "space-between", p: "md", children: [_jsx(Text, { fw: 600, c: "dimmed", children: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043D\u044B\u0435 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438 (\u043D\u0435 \u0443\u0447\u0438\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u0432 \u0431\u0430\u043B\u0430\u043D\u0441\u0435)" }), _jsxs(Badge, { color: "red", variant: "light", children: ["\u0421\u0443\u043C\u043C\u0430: ", formatCurrency(cancelledTransactionsTotal)] })] }), _jsx(Group, { justify: "flex-end", mb: "sm", px: "md", children: _jsx(DataViewToggle, { value: cancelledViewMode, onChange: setCancelledViewMode }) }), _jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: cancelledTableRef, className: "gc-data-table", "data-view": cancelledViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx(Table.Tbody, { children: cancelledTransactions.map((transaction) => (_jsxs(Table.Tr, { style: { opacity: 0.6 }, children: [_jsxs(Table.Td, { children: ["#", transaction.id] }), _jsx(Table.Td, { children: transaction.account.name }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", color: "red", children: getTransactionTypeLabel(transaction.type) }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: "dimmed", children: formatCurrency(transaction.amount) }) }), _jsx(Table.Td, { children: transaction.description || '-' }), _jsx(Table.Td, { children: formatDateTime(transaction.createdAt) })] }, transaction.id))) })] }) })] }))] }), _jsxs(Tabs.Panel, { value: "cash-withdrawals", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0418\u0437\u044A\u044F\u0442\u0438\u044F \u0434\u0435\u043D\u0435\u0436\u043D\u044B\u0445 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => {
                                                withdrawalForm.setFieldValue('type', 'cash');
                                                setCashWithdrawalModalOpened(true);
                                            }, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437\u044A\u044F\u0442\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: withdrawalsViewMode, onChange: setWithdrawalsViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: withdrawalsTableRef, className: "gc-data-table", "data-view": withdrawalsViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0438\u0437\u044A\u044F\u0442\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: withdrawals?.filter((w) => w.type === 'cash').map((withdrawal) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", withdrawal.id] }), _jsx(Table.Td, { children: withdrawal.user.fullName }), _jsx(Table.Td, { children: formatCurrency(withdrawal.amountOrQuantity) }), _jsx(Table.Td, { children: withdrawal.account?.name || '-' }), _jsx(Table.Td, { children: withdrawal.reason || '-' }), _jsx(Table.Td, { children: withdrawal.withdrawalDate
                                                                ? formatDate(new Date(withdrawal.withdrawalDate))
                                                                : '-' }), _jsx(Table.Td, { children: formatDate(withdrawal.createdAt) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                                setSelectedWithdrawal(withdrawal);
                                                                                setViewWithdrawalModalOpened(true);
                                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteWithdrawalMutation.mutate(withdrawal.id), children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, withdrawal.id))) })] }) })] }), _jsxs(Tabs.Panel, { value: "goods-withdrawals", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0418\u0437\u044A\u044F\u0442\u0438\u044F \u0442\u043E\u0432\u0430\u0440\u0430" }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => {
                                                withdrawalForm.setFieldValue('type', 'goods');
                                                setGoodsWithdrawalModalOpened(true);
                                            }, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437\u044A\u044F\u0442\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u0430" })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: withdrawalsViewMode, onChange: setWithdrawalsViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: withdrawalsTableRef, className: "gc-data-table", "data-view": withdrawalsViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u043E\u0441\u0442\u0430\u0432\u043A\u0430" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0438\u0437\u044A\u044F\u0442\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: withdrawals?.filter((w) => w.type === 'goods').map((withdrawal) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", withdrawal.id] }), _jsx(Table.Td, { children: withdrawal.user.fullName }), _jsxs(Table.Td, { children: [withdrawal.amountOrQuantity, " \u0448\u0442"] }), _jsx(Table.Td, { children: withdrawal.costValue
                                                                ? formatCurrency(withdrawal.costValue)
                                                                : '-' }), _jsx(Table.Td, { children: withdrawal.shipment
                                                                ? `#${withdrawal.shipment.id} - ${withdrawal.shipment.supplier.name}`
                                                                : '-' }), _jsx(Table.Td, { children: withdrawal.reason || '-' }), _jsx(Table.Td, { children: withdrawal.withdrawalDate
                                                                ? formatDate(new Date(withdrawal.withdrawalDate))
                                                                : '-' }), _jsx(Table.Td, { children: formatDate(withdrawal.createdAt) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                                setSelectedWithdrawal(withdrawal);
                                                                                setViewWithdrawalModalOpened(true);
                                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteWithdrawalMutation.mutate(withdrawal.id), children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, withdrawal.id))) })] }) })] }), _jsxs(Tabs.Panel, { value: "other-expenses", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u043E\u0447\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u043D\u0430 \u0431\u0438\u0437\u043D\u0435\u0441" }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setOtherExpenseModalOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0440\u0430\u0441\u0445\u043E\u0434" })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: otherExpensesViewMode, onChange: setOtherExpensesViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: otherExpensesTableRef, className: "gc-data-table", "data-view": otherExpensesViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0440\u0430\u0441\u0445\u043E\u0434\u0430" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: otherExpenses && otherExpenses.length > 0 ? (otherExpenses.map((expense) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", expense.id] }), _jsx(Table.Td, { children: expense.account.name }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", children: expense.category }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: "red", children: formatCurrency(expense.amount) }) }), _jsx(Table.Td, { children: expense.description || '-' }), _jsx(Table.Td, { children: expense.expenseDate ? formatDate(expense.expenseDate) : '-' }), _jsx(Table.Td, { children: formatDateTime(expense.createdAt) }), _jsx(Table.Td, { children: _jsx(Group, { gap: "xs", children: _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteOtherExpenseMutation.mutate(expense.id), children: _jsx(IconTrash, { size: 16 }) }) }) }) })] }, expense.id)))) : (_jsx(Table.Tr, { children: _jsx(Table.Td, { colSpan: 8, style: { textAlign: 'center' }, children: _jsx(Text, { c: "dimmed", py: "md", children: "\u041D\u0435\u0442 \u043F\u0440\u043E\u0447\u0438\u0445 \u0440\u0430\u0441\u0445\u043E\u0434\u043E\u0432" }) }) })) })] }) })] })] }), _jsx(MantineModal, { opened: accountModalOpened, onClose: () => {
                        setAccountModalOpened(false);
                        accountForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0447\u0451\u0442", centered: true, children: _jsx("form", { onSubmit: accountForm.onSubmit((values) => createAccountMutation.mutate(values)), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", required: true, ...accountForm.getInputProps('name') }), _jsx(Select, { label: "\u0422\u0438\u043F", required: true, data: [
                                        { value: AccountType.CASH, label: 'Наличные' },
                                        { value: AccountType.BANK, label: 'Банк' },
                                        { value: AccountType.OTHER, label: 'Прочее' },
                                    ], ...accountForm.getInputProps('type') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setAccountModalOpened(false);
                                                accountForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createAccountMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: transactionModalOpened, onClose: () => {
                        setTransactionModalOpened(false);
                        transactionForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044E", centered: true, size: "lg", children: _jsx("form", { onSubmit: transactionForm.onSubmit((values) => createTransactionMutation.mutate(values)), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u0421\u0447\u0451\u0442", required: true, data: accountOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0447\u0451\u0442", value: transactionForm.values.accountId.toString(), onChange: (value) => transactionForm.setFieldValue('accountId', value ? parseInt(value) : 0), error: transactionForm.errors.accountId }), _jsx(NumberInput, { label: "\u0421\u0443\u043C\u043C\u0430", required: true, decimalScale: 2, ...transactionForm.getInputProps('amount') }), _jsx(Select, { label: "\u0422\u0438\u043F", required: true, data: [
                                        { value: TransactionType.PURCHASE, label: 'Закупка' },
                                        { value: TransactionType.SALE, label: 'Продажа' },
                                        { value: TransactionType.BUYBACK, label: 'Выкуп' },
                                        { value: TransactionType.WRITE_OFF, label: 'Списание' },
                                        {
                                            value: TransactionType.PARTNER_WITHDRAWAL,
                                            label: 'Изъятие партнёра',
                                        },
                                    ], ...transactionForm.getInputProps('type') }), _jsx(Textarea, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", rows: 3, ...transactionForm.getInputProps('description') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setTransactionModalOpened(false);
                                                transactionForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createTransactionMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: cashWithdrawalModalOpened, onClose: () => {
                        setCashWithdrawalModalOpened(false);
                        setWithdrawalUserId(0);
                        withdrawalForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437\u044A\u044F\u0442\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432", centered: true, size: "lg", children: _jsx("form", { onSubmit: withdrawalForm.onSubmit((values) => {
                            createWithdrawalMutation.mutate({ ...values, type: 'cash', userId: withdrawalUserId });
                        }), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C", required: true, data: superAdminOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430", value: withdrawalUserId?.toString() || '', onChange: (value) => setWithdrawalUserId(value ? parseInt(value) : 0) }), _jsx(Select, { label: "\u0421\u0447\u0451\u0442", required: true, data: accountOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0447\u0451\u0442", value: withdrawalForm.values.accountId?.toString() || '', onChange: (value) => withdrawalForm.setFieldValue('accountId', value ? parseInt(value) : 0), error: withdrawalForm.errors.accountId }), _jsx(TextInput, { label: "\u0421\u0443\u043C\u043C\u0430", required: true, type: "number", step: "0.01", ...withdrawalForm.getInputProps('amountOrQuantity') }), _jsx(Textarea, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430", required: true, rows: 3, ...withdrawalForm.getInputProps('reason') }), _jsx(TextInput, { type: "date", label: "\u0414\u0430\u0442\u0430 \u0438\u0437\u044A\u044F\u0442\u0438\u044F", ...withdrawalForm.getInputProps('withdrawalDate') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setCashWithdrawalModalOpened(false);
                                                withdrawalForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createWithdrawalMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: goodsWithdrawalModalOpened, onClose: () => {
                        setGoodsWithdrawalModalOpened(false);
                        setWithdrawalUserId(0);
                        withdrawalForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u0437\u044A\u044F\u0442\u0438\u0435 \u0442\u043E\u0432\u0430\u0440\u0430", centered: true, size: "lg", children: _jsx("form", { onSubmit: withdrawalForm.onSubmit((values) => {
                            createWithdrawalMutation.mutate({ ...values, type: 'goods', userId: withdrawalUserId });
                        }), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C", required: true, data: superAdminOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430", value: withdrawalUserId?.toString() || '', onChange: (value) => setWithdrawalUserId(value ? parseInt(value) : 0) }), _jsx(Select, { label: "\u041F\u043E\u0441\u0442\u0430\u0432\u043A\u0430", required: true, data: shipments?.map((shipment) => ({
                                        value: shipment.id.toString(),
                                        label: `#${shipment.id} - ${shipment.supplier.name} (${formatDate(shipment.arrivalDate)})`,
                                    })) || [], searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0443", value: withdrawalForm.values.shipmentId?.toString() || '', onChange: (value) => {
                                        withdrawalForm.setFieldValue('shipmentId', value ? parseInt(value) : 0);
                                        // Очищаем количество и стоимость при смене поставки
                                        withdrawalForm.setFieldValue('amountOrQuantity', '');
                                        withdrawalForm.setFieldValue('costValue', '');
                                    }, error: withdrawalForm.errors.shipmentId, disabled: isLoadingShipments }), _jsx(TextInput, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, type: "number", step: "0.01", ...withdrawalForm.getInputProps('amountOrQuantity') }), _jsx(NumberInput, { label: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C", decimalScale: 2, readOnly: true, ...withdrawalForm.getInputProps('costValue') }), _jsx(Textarea, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430", required: true, rows: 3, ...withdrawalForm.getInputProps('reason') }), _jsx(TextInput, { type: "date", label: "\u0414\u0430\u0442\u0430 \u0438\u0437\u044A\u044F\u0442\u0438\u044F", ...withdrawalForm.getInputProps('withdrawalDate') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setGoodsWithdrawalModalOpened(false);
                                                withdrawalForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createWithdrawalMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: otherExpenseModalOpened, onClose: () => {
                        setOtherExpenseModalOpened(false);
                        otherExpenseForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0447\u0438\u0439 \u0440\u0430\u0441\u0445\u043E\u0434", centered: true, size: "lg", children: _jsx("form", { onSubmit: otherExpenseForm.onSubmit((values) => createOtherExpenseMutation.mutate(values)), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u0421\u0447\u0451\u0442", required: true, data: accountOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0447\u0451\u0442", value: otherExpenseForm.values.accountId.toString(), onChange: (value) => otherExpenseForm.setFieldValue('accountId', value ? parseInt(value) : 0), error: otherExpenseForm.errors.accountId }), _jsx(NumberInput, { label: "\u0421\u0443\u043C\u043C\u0430", required: true, decimalScale: 2, min: 0.01, ...otherExpenseForm.getInputProps('amount') }), _jsx(TextInput, { label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", required: true, placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0410\u0440\u0435\u043D\u0434\u0430, \u041A\u043E\u043C\u043C\u0443\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u043B\u0443\u0433\u0438, \u0420\u0435\u043A\u043B\u0430\u043C\u0430", ...otherExpenseForm.getInputProps('category') }), _jsx(Textarea, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", rows: 3, placeholder: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0440\u0430\u0441\u0445\u043E\u0434\u0435", ...otherExpenseForm.getInputProps('description') }), _jsx(TextInput, { type: "date", label: "\u0414\u0430\u0442\u0430 \u0440\u0430\u0441\u0445\u043E\u0434\u0430", ...otherExpenseForm.getInputProps('expenseDate') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOtherExpenseModalOpened(false);
                                                otherExpenseForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createOtherExpenseMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: viewTransactionModalOpened, onClose: () => {
                        setViewTransactionModalOpened(false);
                        setSelectedTransaction(null);
                    }, title: `Транзакция #${selectedTransaction?.id || transactionDetails?.id || ''}`, centered: true, size: "lg", children: (transactionDetails || selectedTransaction) && (_jsx(Stack, { gap: "md", children: (() => {
                            const transaction = transactionDetails || selectedTransaction;
                            return (_jsxs(_Fragment, { children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "ID:" }), _jsxs(Text, { children: ["#", transaction.id] })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0447\u0451\u0442:" }), _jsx(Text, { children: transaction.account.name }), _jsx(Badge, { variant: "light", children: getAccountTypeLabel(transaction.account.type) })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0422\u0438\u043F \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438:" }), _jsx(Badge, { variant: "light", color: transaction.isCancelled ? 'red' : undefined, children: getTransactionTypeLabel(transaction.type) })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0443\u043C\u043C\u0430:" }), _jsx(Text, { fw: 700, size: "lg", c: Number(transaction.amount) >= 0 ? 'green' : 'red', children: formatCurrency(transaction.amount) })] }), transaction.description && (_jsxs(Stack, { gap: "xs", children: [_jsx(Text, { fw: 600, children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435:" }), _jsx(Text, { style: { wordWrap: 'break-word', overflowWrap: 'break-word' }, children: transaction.description })] })), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0442\u0430\u0442\u0443\u0441:" }), _jsx(Badge, { color: transaction.isCancelled ? 'red' : 'green', variant: "light", children: transaction.isCancelled ? 'Отменена' : 'Активна' })] }), transaction.linkedEntityId && transaction.linkedEntityType && (_jsx(_Fragment, { children: _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0432\u044F\u0437\u0430\u043D\u043D\u0430\u044F \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u044C:" }), _jsxs(Text, { children: [transaction.linkedEntityType === 'sale' && 'Продажа', transaction.linkedEntityType === 'shipment' && 'Поставка', transaction.linkedEntityType === 'buyback' && 'Выкуп', transaction.linkedEntityType === 'write_off' && 'Списание', transaction.linkedEntityType === 'partner_withdrawal' &&
                                                            'Изъятие партнёра', !['sale', 'shipment', 'buyback', 'write_off', 'partner_withdrawal'].includes(transaction.linkedEntityType) && transaction.linkedEntityType] }), _jsxs(Text, { c: "dimmed", children: ["#", transaction.linkedEntityId] })] }) })), transaction.sale && (_jsxs("div", { children: [_jsx(Text, { fw: 600, mb: "xs", children: "\u0421\u0432\u044F\u0437\u0430\u043D\u043D\u0430\u044F \u043F\u0440\u043E\u0434\u0430\u0436\u0430:" }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u0422\u043E\u0432\u0430\u0440\u043E\u0432" })] }) }), _jsx(Table.Tbody, { children: _jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", transaction.sale.id] }), _jsx(Table.Td, { children: transaction.sale.client.fullName }), _jsx(Table.Td, { children: formatDate(transaction.sale.saleDate) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, children: formatCurrency(transaction.sale.totalAmount) }) }), _jsx(Table.Td, { children: _jsx(Badge, { color: transaction.sale.status === 'completed' ? 'green' : 'red', variant: "light", children: transaction.sale.status === 'completed' ? 'Завершена' : 'Отменена' }) }), _jsx(Table.Td, { children: transaction.sale.items.length })] }) })] }), transaction.sale.items.length > 0 && (_jsxs("div", { style: { marginTop: 'var(--mantine-spacing-md)' }, children: [_jsx(Text, { fw: 600, mb: "xs", size: "sm", children: "\u0422\u043E\u0432\u0430\u0440\u044B \u0432 \u043F\u0440\u043E\u0434\u0430\u0436\u0435:" }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u041F\u0430\u0440\u0442\u0438\u044F" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" })] }) }), _jsx(Table.Tbody, { children: transaction.sale.items.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: [item.batch.plantType, " (", item.batch.sizeCmMin, "-", item.batch.sizeCmMax, "\u0441\u043C, ", item.batch.potType, ")"] }), _jsx(Table.Td, { children: item.quantity }), _jsx(Table.Td, { children: formatCurrency(item.salePricePerUnit) }), _jsx(Table.Td, { children: formatCurrency((item.quantity * Number(item.salePricePerUnit)).toString()) })] }, item.id))) })] })] })), _jsxs(Group, { justify: "space-between", mt: "xs", children: [_jsxs(Text, { c: "dimmed", size: "xs", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u043E: ", formatDate(transaction.sale.createdAt)] }), transaction.sale.updatedAt !== transaction.sale.createdAt && (_jsxs(Text, { c: "dimmed", size: "xs", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ", formatDate(transaction.sale.updatedAt)] }))] })] })), _jsxs("div", { children: [_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u043E: ", formatDateTime(transaction.createdAt)] }), transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ", formatDateTime(transaction.updatedAt)] }))] })] }));
                        })() })) }), _jsx(MantineModal, { opened: viewWithdrawalModalOpened, onClose: () => {
                        setViewWithdrawalModalOpened(false);
                        setSelectedWithdrawal(null);
                    }, title: `Изъятие #${selectedWithdrawal?.id || withdrawalDetails?.id || ''}`, centered: true, size: "lg", children: (withdrawalDetails || selectedWithdrawal) && (_jsx(Stack, { gap: "md", children: (() => {
                            const withdrawal = withdrawalDetails || selectedWithdrawal;
                            return (_jsxs(_Fragment, { children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "ID:" }), _jsxs(Text, { children: ["#", withdrawal.id] })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041F\u0430\u0440\u0442\u043D\u0451\u0440:" }), _jsx(Text, { children: withdrawal.user.fullName })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0422\u0438\u043F \u0438\u0437\u044A\u044F\u0442\u0438\u044F:" }), _jsx(Badge, { variant: "light", children: withdrawal.type === 'cash' ? 'Деньги' : 'Товар' })] }), withdrawal.account && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0447\u0451\u0442:" }), _jsx(Text, { children: withdrawal.account.name }), _jsx(Badge, { variant: "light", children: getAccountTypeLabel(withdrawal.account.type) })] })), _jsxs(Group, { children: [_jsxs(Text, { fw: 600, children: [withdrawal.type === 'cash' ? 'Сумма' : 'Количество', ":"] }), _jsx(Text, { fw: 700, size: "lg", children: withdrawal.type === 'cash'
                                                    ? formatCurrency(withdrawal.amountOrQuantity)
                                                    : `${withdrawal.amountOrQuantity} шт` })] }), withdrawal.costValue && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C:" }), _jsx(Text, { fw: 700, size: "lg", c: "green", children: formatCurrency(withdrawal.costValue) })] })), withdrawal.shipment && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041F\u043E\u0441\u0442\u0430\u0432\u043A\u0430:" }), _jsxs(Text, { children: ["#", withdrawal.shipment.id, " - ", withdrawal.shipment.supplier.name] }), _jsxs(Text, { c: "dimmed", size: "sm", children: ["(", formatDate(withdrawal.shipment.arrivalDate), ")"] })] })), withdrawal.reason && (_jsxs(Stack, { gap: "xs", children: [_jsx(Text, { fw: 600, children: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430:" }), _jsx(Text, { style: { wordWrap: 'break-word', overflowWrap: 'break-word' }, children: withdrawal.reason })] })), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0414\u0430\u0442\u0430 \u0438\u0437\u044A\u044F\u0442\u0438\u044F:" }), _jsx(Text, { children: withdrawal.withdrawalDate
                                                    ? formatDate(new Date(withdrawal.withdrawalDate))
                                                    : 'Не указана' })] }), _jsx("div", { children: _jsxs(Text, { c: "dimmed", size: "sm", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u043E: ", formatDateTime(withdrawal.createdAt)] }) })] }));
                        })() })) }), _jsx(MantineModal, { opened: viewAccountModalOpened, onClose: () => {
                        setViewAccountModalOpened(false);
                        setSelectedAccount(null);
                    }, title: `Счёт #${selectedAccount?.id || accountDetails?.id || ''}`, centered: true, size: "lg", children: (accountDetails || selectedAccount) && (_jsx(Stack, { gap: "md", children: (() => {
                            const account = accountDetails || selectedAccount;
                            const accountTransactions = account.transactions || [];
                            const activeTransactions = accountTransactions.filter((t) => !t.isCancelled);
                            const cancelledTransactions = accountTransactions.filter((t) => t.isCancelled);
                            return (_jsxs(_Fragment, { children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "ID:" }), _jsxs(Text, { children: ["#", account.id] })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435:" }), _jsx(Text, { children: account.name })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0422\u0438\u043F \u0441\u0447\u0451\u0442\u0430:" }), _jsx(Badge, { variant: "light", children: getAccountTypeLabel(account.type) })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0411\u0430\u043B\u0430\u043D\u0441:" }), _jsx(Text, { fw: 700, size: "lg", c: Number(account.balance) >= 0 ? 'green' : 'red', children: formatCurrency(account.balance) })] }), accountTransactions.length > 0 && (_jsxs(_Fragment, { children: [_jsx(Divider, { label: "\u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438", labelPosition: "center" }), activeTransactions.length > 0 && (_jsxs("div", { children: [_jsxs(Text, { fw: 600, mb: "xs", children: ["\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438 (", activeTransactions.length, ")"] }), _jsx("div", { style: { overflowX: 'auto', width: '100%' }, children: _jsxs(Table, { striped: true, highlightOnHover: true, style: { minWidth: '600px' }, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "ID" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { style: { minWidth: '200px' }, children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx(Table.Tbody, { children: activeTransactions.map((transaction) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { style: { whiteSpace: 'nowrap' }, children: ["#", transaction.id] }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: _jsx(Badge, { variant: "light", children: getTransactionTypeLabel(transaction.type) }) }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: _jsx(Text, { fw: 700, c: Number(transaction.amount) >= 0 ? 'green' : 'red', children: formatCurrency(transaction.amount) }) }), _jsx(Table.Td, { children: _jsx(Text, { style: {
                                                                                        wordWrap: 'break-word',
                                                                                        overflowWrap: 'break-word',
                                                                                    }, children: transaction.description || '-' }) }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: formatDateTime(transaction.createdAt) })] }, transaction.id))) })] }) })] })), cancelledTransactions.length > 0 && (_jsxs("div", { children: [_jsxs(Text, { fw: 600, mb: "xs", c: "dimmed", children: ["\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043D\u044B\u0435 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438 (", cancelledTransactions.length, ")"] }), _jsx("div", { style: { overflowX: 'auto', width: '100%' }, children: _jsxs(Table, { striped: true, highlightOnHover: true, style: { minWidth: '600px' }, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "ID" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { style: { minWidth: '200px' }, children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { style: { whiteSpace: 'nowrap' }, children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx(Table.Tbody, { children: cancelledTransactions.map((transaction) => (_jsxs(Table.Tr, { style: { opacity: 0.6 }, children: [_jsxs(Table.Td, { style: { whiteSpace: 'nowrap' }, children: ["#", transaction.id] }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: _jsx(Badge, { variant: "light", color: "red", children: getTransactionTypeLabel(transaction.type) }) }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: _jsx(Text, { fw: 700, c: "dimmed", children: formatCurrency(transaction.amount) }) }), _jsx(Table.Td, { children: _jsx(Text, { style: {
                                                                                        wordWrap: 'break-word',
                                                                                        overflowWrap: 'break-word',
                                                                                    }, children: transaction.description || '-' }) }), _jsx(Table.Td, { style: { whiteSpace: 'nowrap' }, children: formatDateTime(transaction.createdAt) })] }, transaction.id))) })] }) })] }))] })), accountTransactions.length === 0 && (_jsx(Text, { c: "dimmed", ta: "center", py: "md", children: "\u041D\u0435\u0442 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0439" })), _jsxs("div", { children: [_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u043E: ", formatDateTime(account.createdAt)] }), account.updatedAt && account.updatedAt !== account.createdAt && (_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ", formatDateTime(account.updatedAt)] }))] })] }));
                        })() })) })] }) }));
}
