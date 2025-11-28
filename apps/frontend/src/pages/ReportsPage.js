import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, Badge, Select, TextInput, SimpleGrid, Tabs, } from '@mantine/core';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { reportsService, } from '../services/reports.service';
import { formatCurrency, formatDate } from '../utils/format';
import { exportToExcel } from '../utils/excel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
export function ReportsPage() {
    const [activeTab, setActiveTab] = useState('profit-by-shipment');
    const [params, setParams] = useState({});
    const [profitShipmentViewMode, setProfitShipmentViewMode] = useLocalStorage({
        key: 'reports-profit-shipment-view',
        defaultValue: 'table',
    });
    const [profitClientViewMode, setProfitClientViewMode] = useLocalStorage({
        key: 'reports-profit-client-view',
        defaultValue: 'table',
    });
    const [buybackForecastViewMode, setBuybackForecastViewMode] = useLocalStorage({
        key: 'reports-buyback-forecast-view',
        defaultValue: 'table',
    });
    const [cashFlowViewMode, setCashFlowViewMode] = useLocalStorage({
        key: 'reports-cash-flow-view',
        defaultValue: 'table',
    });
    const [clientActivityViewMode, setClientActivityViewMode] = useLocalStorage({
        key: 'reports-client-activity-view',
        defaultValue: 'table',
    });
    const [salesByPeriodViewMode, setSalesByPeriodViewMode] = useLocalStorage({
        key: 'reports-sales-by-period-view',
        defaultValue: 'table',
    });
    const [profitByPlantTypeViewMode, setProfitByPlantTypeViewMode] = useLocalStorage({
        key: 'reports-profit-by-plant-type-view',
        defaultValue: 'table',
    });
    const [returnsAndWriteoffsViewMode, setReturnsAndWriteoffsViewMode] = useLocalStorage({
        key: 'reports-returns-and-writeoffs-view',
        defaultValue: 'table',
    });
    const [groupBy, setGroupBy] = useState('month');
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
    const isLoading = isLoadingProfitByShipment ||
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
        }
        catch (error) {
            notifications.show({
                title: 'Ошибка',
                message: 'Не удалось экспортировать отчёт',
                color: 'red',
            });
        }
    };
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsx(Group, { justify: "space-between", children: _jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041E\u0442\u0447\u0451\u0442\u044B" }), _jsx(Text, { c: "dimmed", children: "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 \u0438 \u043E\u0442\u0447\u0451\u0442\u044B \u043F\u043E \u0431\u0438\u0437\u043D\u0435\u0441\u0443" })] }) }), _jsx(Paper, { withBorder: true, p: "md", children: _jsxs(SimpleGrid, { cols: { base: 1, sm: 2, lg: 4 }, spacing: "md", children: [_jsx(TextInput, { label: "\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430", type: "date", value: params.startDate || '', onChange: (e) => setParams({ ...params, startDate: e.currentTarget.value || undefined }) }), _jsx(TextInput, { label: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F", type: "date", value: params.endDate || '', onChange: (e) => setParams({ ...params, endDate: e.currentTarget.value || undefined }) }), _jsx(TextInput, { label: "ID \u043A\u043B\u0438\u0435\u043D\u0442\u0430", type: "number", value: params.clientId || '', onChange: (e) => setParams({
                                    ...params,
                                    clientId: e.currentTarget.value
                                        ? parseInt(e.currentTarget.value)
                                        : undefined,
                                }) }), _jsx(TextInput, { label: "ID \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0438", type: "number", value: params.shipmentId || '', onChange: (e) => setParams({
                                    ...params,
                                    shipmentId: e.currentTarget.value
                                        ? parseInt(e.currentTarget.value)
                                        : undefined,
                                }) }), activeTab === 'sales-by-period' && (_jsx(Select, { label: "\u0413\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u0430", value: groupBy, onChange: (value) => setGroupBy(value || 'month'), data: [
                                    { value: 'day', label: 'По дням' },
                                    { value: 'week', label: 'По неделям' },
                                    { value: 'month', label: 'По месяцам' },
                                ] }))] }) }), _jsxs(Tabs, { value: activeTab, onChange: setActiveTab, children: [_jsxs(Tabs.List, { children: [_jsx(Tabs.Tab, { value: "profit-by-shipment", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043F\u043E \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0430\u043C" }), _jsx(Tabs.Tab, { value: "profit-by-client", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043F\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C" }), _jsx(Tabs.Tab, { value: "sales-by-period", children: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \u043F\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430\u043C" }), _jsx(Tabs.Tab, { value: "profit-by-plant-type", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0442\u0438\u043F\u0430\u043C \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u0439" }), _jsx(Tabs.Tab, { value: "returns-and-writeoffs", children: "\u0412\u043E\u0437\u0432\u0440\u0430\u0442\u044B \u0438 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F" }), _jsx(Tabs.Tab, { value: "buyback-forecast", children: "\u041F\u0440\u043E\u0433\u043D\u043E\u0437 \u0432\u044B\u043A\u0443\u043F\u0430" }), _jsx(Tabs.Tab, { value: "cash-flow", children: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }), _jsx(Tabs.Tab, { value: "client-activity", children: "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432" })] }), _jsxs(Tabs.Panel, { value: "profit-by-shipment", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043F\u043E \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0430\u043C" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: profitShipmentViewMode, onChange: setProfitShipmentViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : (_jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: profitShipmentTableRef, className: "gc-data-table", "data-view": profitShipmentViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0438" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" }), _jsx(Table.Th, { children: "\u041C\u0430\u0440\u0436\u0430" })] }) }), _jsx(Table.Tbody, { children: profitByShipment?.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.shipmentId] }), _jsx(Table.Td, { children: formatDate(item.shipmentDate) }), _jsx(Table.Td, { children: item.supplierName }), _jsx(Table.Td, { children: formatCurrency(item.totalCost) }), _jsx(Table.Td, { children: formatCurrency(item.totalRevenue) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: item.profit >= 0 ? 'green' : 'red', children: formatCurrency(item.profit) }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: item.profitMargin >= 0 ? 'green' : 'red', variant: "light", children: [item.profitMargin.toFixed(2), "%"] }) })] }, item.shipmentId))) })] }) }))] }), _jsxs(Tabs.Panel, { value: "profit-by-client", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043F\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: profitClientViewMode, onChange: setProfitClientViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : (_jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: profitClientTableRef, className: "gc-data-table", "data-view": profitClientViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0434\u0430\u0436" }), _jsx(Table.Th, { children: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" }), _jsx(Table.Th, { children: "\u041C\u0430\u0440\u0436\u0430" })] }) }), _jsx(Table.Tbody, { children: profitByClient?.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.clientId] }), _jsx(Table.Td, { children: item.clientName }), _jsx(Table.Td, { children: item.salesCount }), _jsx(Table.Td, { children: formatCurrency(item.totalRevenue) }), _jsx(Table.Td, { children: formatCurrency(item.totalCost) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: item.profit >= 0 ? 'green' : 'red', children: formatCurrency(item.profit) }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: item.profitMargin >= 0 ? 'green' : 'red', variant: "light", children: [item.profitMargin.toFixed(2), "%"] }) })] }, item.clientId))) })] }) }))] }), _jsxs(Tabs.Panel, { value: "sales-by-period", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \u043F\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430\u043C" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: salesByPeriodViewMode, onChange: setSalesByPeriodViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : salesByPeriod && salesByPeriod.length > 0 ? (_jsxs(Stack, { gap: "md", children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Text, { fw: 600, mb: "md", children: "\u0414\u0438\u043D\u0430\u043C\u0438\u043A\u0430 \u043F\u0440\u043E\u0434\u0430\u0436" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: salesByPeriod, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "period", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 80 }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value), labelStyle: { color: 'var(--mantine-color-text)' }, contentStyle: {
                                                                    backgroundColor: 'var(--mantine-color-body)',
                                                                    border: '1px solid var(--mantine-color-default-border)',
                                                                } }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "totalRevenue", stroke: "var(--mantine-color-blue-6)", strokeWidth: 2, name: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Line, { type: "monotone", dataKey: "totalCost", stroke: "var(--mantine-color-red-6)", strokeWidth: 2, name: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Line, { type: "monotone", dataKey: "profit", stroke: "var(--mantine-color-green-6)", strokeWidth: 2, name: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" })] }) })] }), _jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: salesByPeriodTableRef, className: "gc-data-table", "data-view": salesByPeriodViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u041F\u0435\u0440\u0438\u043E\u0434" }), _jsx(Table.Th, { children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx(Table.Th, { children: "\u041A\u043E\u043D\u0435\u0446" }), _jsx(Table.Th, { children: "\u041F\u0440\u043E\u0434\u0430\u0436" }), _jsx(Table.Th, { children: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" }), _jsx(Table.Th, { children: "\u041C\u0430\u0440\u0436\u0430" }), _jsx(Table.Th, { children: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0447\u0435\u043A" })] }) }), _jsx(Table.Tbody, { children: salesByPeriod.map((item, index) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: item.period }), _jsx(Table.Td, { children: formatDate(item.periodStart) }), _jsx(Table.Td, { children: formatDate(item.periodEnd) }), _jsx(Table.Td, { children: _jsx(Badge, { color: "blue", variant: "light", children: item.salesCount }) }), _jsx(Table.Td, { children: formatCurrency(item.totalRevenue) }), _jsx(Table.Td, { children: formatCurrency(item.totalCost) }), _jsx(Table.Td, { children: _jsx(Badge, { color: item.profit >= 0 ? 'green' : 'red', variant: "light", children: formatCurrency(item.profit) }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: item.profitMargin >= 0 ? 'green' : 'red', variant: "light", children: [item.profitMargin.toFixed(2), "%"] }) }), _jsx(Table.Td, { children: formatCurrency(item.averageSaleAmount) })] }, index))) })] }) })] })) : (_jsx(Text, { c: "dimmed", ta: "center", py: "xl", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }))] }), _jsxs(Tabs.Panel, { value: "profit-by-plant-type", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0442\u0438\u043F\u0430\u043C \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u0439" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: profitByPlantTypeViewMode, onChange: setProfitByPlantTypeViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : profitByPlantType && profitByPlantType.length > 0 ? (_jsxs(Stack, { gap: "md", children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Text, { fw: 600, mb: "md", children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0442\u0438\u043F\u0430\u043C \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u0439" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: profitByPlantType, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "plantType", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 100 }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value), labelStyle: { color: 'var(--mantine-color-text)' }, contentStyle: {
                                                                    backgroundColor: 'var(--mantine-color-body)',
                                                                    border: '1px solid var(--mantine-color-default-border)',
                                                                } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "totalRevenue", fill: "var(--mantine-color-blue-6)", name: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Bar, { dataKey: "totalCost", fill: "var(--mantine-color-red-6)", name: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Bar, { dataKey: "profit", fill: "var(--mantine-color-green-6)", name: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" })] }) })] }), _jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: profitByPlantTypeTableRef, className: "gc-data-table", "data-view": profitByPlantTypeViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0422\u0438\u043F \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0434\u0430\u043D\u043E" }), _jsx(Table.Th, { children: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" }), _jsx(Table.Th, { children: "\u041C\u0430\u0440\u0436\u0430" }), _jsx(Table.Th, { children: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0446\u0435\u043D\u0430" }), _jsx(Table.Th, { children: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F \u0441\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u0440\u043E\u0434\u0430\u0436" })] }) }), _jsx(Table.Tbody, { children: profitByPlantType.map((item, index) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: _jsx(Text, { fw: 500, children: item.plantType }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: "blue", variant: "light", children: [item.totalQuantitySold, " \u0448\u0442"] }) }), _jsx(Table.Td, { children: formatCurrency(item.totalRevenue) }), _jsx(Table.Td, { children: formatCurrency(item.totalCost) }), _jsx(Table.Td, { children: _jsx(Badge, { color: item.profit >= 0 ? 'green' : 'red', variant: "light", children: formatCurrency(item.profit) }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: item.profitMargin >= 0 ? 'green' : 'red', variant: "light", children: [item.profitMargin.toFixed(2), "%"] }) }), _jsx(Table.Td, { children: formatCurrency(item.averagePricePerUnit) }), _jsx(Table.Td, { children: formatCurrency(item.averageCostPerUnit) }), _jsx(Table.Td, { children: _jsx(Badge, { color: "gray", variant: "light", children: item.salesCount }) })] }, index))) })] }) })] })) : (_jsx(Text, { c: "dimmed", ta: "center", py: "xl", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }))] }), _jsxs(Tabs.Panel, { value: "returns-and-writeoffs", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0412\u043E\u0437\u0432\u0440\u0430\u0442\u044B \u0438 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: returnsAndWriteoffsViewMode, onChange: setReturnsAndWriteoffsViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : returnsAndWriteoffs && returnsAndWriteoffs.length > 0 ? (_jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: returnsAndWriteoffsTableRef, className: "gc-data-table", "data-view": returnsAndWriteoffsViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430 \u0432\u044B\u043A\u0443\u043F\u0430" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u0423\u0431\u044B\u0442\u043E\u043A" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: returnsAndWriteoffs.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.buybackId] }), _jsx(Table.Td, { children: item.clientName }), _jsx(Table.Td, { children: formatDate(item.date) }), _jsx(Table.Td, { children: _jsx(Badge, { color: item.type === 'return' ? 'blue' : 'red', variant: "light", children: item.type === 'return' ? 'Возврат' : 'Списание' }) }), _jsx(Table.Td, { children: _jsx(Badge, { color: item.status === 'completed'
                                                                    ? 'green'
                                                                    : item.status === 'declined'
                                                                        ? 'red'
                                                                        : 'gray', variant: "light", children: item.status === 'completed'
                                                                    ? 'Завершён'
                                                                    : item.status === 'declined'
                                                                        ? 'Отклонён'
                                                                        : item.status }) }), _jsx(Table.Td, { children: _jsxs(Badge, { color: "blue", variant: "light", children: [item.totalQuantity, " \u0448\u0442"] }) }), _jsx(Table.Td, { children: item.buybackAmount > 0
                                                                ? formatCurrency(item.buybackAmount)
                                                                : '-' }), _jsx(Table.Td, { children: formatCurrency(item.originalCost) }), _jsx(Table.Td, { children: _jsx(Badge, { color: "red", variant: "light", children: formatCurrency(item.loss) }) }), _jsx(Table.Td, { children: _jsx(Text, { size: "sm", c: "dimmed", lineClamp: 2, children: item.notes || '-' }) })] }, item.buybackId))) })] }) })) : (_jsx(Text, { c: "dimmed", ta: "center", py: "xl", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }))] }), _jsxs(Tabs.Panel, { value: "buyback-forecast", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u041F\u0440\u043E\u0433\u043D\u043E\u0437 \u0432\u044B\u043A\u0443\u043F\u0430" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: buybackForecastViewMode, onChange: setBuybackForecastViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : (_jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: buybackForecastTableRef, className: "gc-data-table", "data-view": buybackForecastViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID \u0432\u044B\u043A\u0443\u043F\u0430" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u041F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u0421\u0435\u0431\u0435\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0431\u044B\u043B\u044C" })] }) }), _jsx(Table.Tbody, { children: buybackForecast?.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.buybackId] }), _jsx(Table.Td, { children: item.clientName }), _jsx(Table.Td, { children: formatDate(item.plannedDate) }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", children: item.status }) }), _jsx(Table.Td, { children: item.totalQuantity }), _jsx(Table.Td, { children: formatCurrency(item.estimatedRevenue) }), _jsx(Table.Td, { children: formatCurrency(item.estimatedCost) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: item.estimatedProfit >= 0 ? 'green' : 'red', children: formatCurrency(item.estimatedProfit) }) })] }, item.buybackId))) })] }) }))] }), _jsxs(Tabs.Panel, { value: "cash-flow", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0434\u0435\u043D\u0435\u0436\u043D\u044B\u0445 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: cashFlowViewMode, onChange: setCashFlowViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : cashFlow && cashFlow.length > 0 ? (_jsxs(Stack, { gap: "md", children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Text, { fw: 600, mb: "md", children: "\u0414\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0434\u0435\u043D\u0435\u0436\u043D\u044B\u0445 \u0441\u0440\u0435\u0434\u0441\u0442\u0432" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: cashFlow, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 80 }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value) => formatCurrency(value), labelStyle: { color: 'var(--mantine-color-text)' }, contentStyle: {
                                                                    backgroundColor: 'var(--mantine-color-body)',
                                                                    border: '1px solid var(--mantine-color-default-border)',
                                                                } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "income", fill: "var(--mantine-color-green-6)", name: "\u041F\u0440\u0438\u0445\u043E\u0434" }), _jsx(Bar, { dataKey: "expense", fill: "var(--mantine-color-red-6)", name: "\u0420\u0430\u0441\u0445\u043E\u0434" })] }) })] }), _jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: cashFlowTableRef, className: "gc-data-table", "data-view": cashFlowViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F \u0441\u0447\u0451\u0442\u0430" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0445\u043E\u0434" }), _jsx(Table.Th, { children: "\u0420\u0430\u0441\u0445\u043E\u0434" }), _jsx(Table.Th, { children: "\u0411\u0430\u043B\u0430\u043D\u0441" })] }) }), _jsx(Table.Tbody, { children: cashFlow.map((item, index) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: formatDate(item.date) }), _jsx(Table.Td, { children: item.accountName }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", children: item.accountType }) }), _jsx(Table.Td, { children: _jsx(Text, { c: "green", fw: 700, children: formatCurrency(item.income) }) }), _jsx(Table.Td, { children: _jsx(Text, { c: "red", fw: 700, children: formatCurrency(item.expense) }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: item.balance >= 0 ? 'green' : 'red', children: formatCurrency(item.balance) }) })] }, index))) })] }) })] })) : (_jsx(Text, { c: "dimmed", ta: "center", py: "xl", children: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0435\u0440\u0438\u043E\u0434" }))] }), _jsxs(Tabs.Panel, { value: "client-activity", pt: "md", children: [_jsxs(Group, { justify: "space-between", mb: "md", children: [_jsx(Text, { c: "dimmed", children: "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432" }), _jsxs(Group, { gap: "xs", children: [_jsx(DataViewToggle, { value: clientActivityViewMode, onChange: setClientActivityViewMode }), _jsx(Button, { leftSection: _jsx(IconDownload, { size: 16 }), onClick: handleExport, variant: "light", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442" })] })] }), isLoading ? (_jsx(LoadingSpinner, {})) : (_jsx(Paper, { withBorder: true, children: _jsxs(Table, { ref: clientActivityTableRef, className: "gc-data-table", "data-view": clientActivityViewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u041F\u0435\u0440\u0432\u0430\u044F \u043F\u043E\u043A\u0443\u043F\u043A\u0430" }), _jsx(Table.Th, { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043F\u043E\u043A\u0443\u043F\u043A\u0430" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u043E\u043A\u0443\u043F\u043E\u043A" }), _jsx(Table.Th, { children: "\u0412\u044B\u0440\u0443\u0447\u043A\u0430" }), _jsx(Table.Th, { children: "\u0412\u044B\u043A\u0443\u043F\u043E\u0432" })] }) }), _jsx(Table.Tbody, { children: clientActivity?.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.clientId] }), _jsx(Table.Td, { children: item.clientName }), _jsx(Table.Td, { children: item.firstPurchaseDate
                                                                ? formatDate(item.firstPurchaseDate)
                                                                : '-' }), _jsx(Table.Td, { children: item.lastPurchaseDate
                                                                ? formatDate(item.lastPurchaseDate)
                                                                : '-' }), _jsx(Table.Td, { children: item.totalPurchases }), _jsx(Table.Td, { children: formatCurrency(item.totalRevenue) }), _jsx(Table.Td, { children: item.buybacksCount })] }, item.clientId))) })] }) }))] })] })] }) }));
}
