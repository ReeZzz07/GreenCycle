import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, Badge, ActionIcon, Tooltip, Modal as MantineModal, Tabs, Select, TextInput, NumberInput, Textarea, } from '@mantine/core';
import { IconPlus, IconEye, IconCheck, IconX, IconFileDownload, IconEdit, IconTrash, } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { buybacksService } from '../services/buybacks.service';
import { salesService } from '../services/sales.service';
import { clientsService } from '../services/clients.service';
import { BuybackStatus, } from '../types/buybacks';
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
    const [selectedBuyback, setSelectedBuyback] = useState(null);
    const [buybackToEdit, setBuybackToEdit] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useLocalStorage({
        key: 'buybacks-view-mode',
        defaultValue: 'table',
    });
    const queryClient = useQueryClient();
    const { user } = useAuthContext();
    const isAdmin = user?.role.name === 'admin' || user?.role.name === 'super_admin';
    const { data: buybacks, isLoading } = useQuery({
        queryKey: ['buybacks', statusFilter === 'all' ? undefined : statusFilter],
        queryFn: () => buybacksService.getAll(statusFilter === 'all' ? undefined : statusFilter),
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
        queryFn: () => buybacksService.getById(selectedBuyback.id),
        enabled: viewModalOpened && !!selectedBuyback,
    });
    const form = useForm({
        initialValues: {
            originalSaleId: 0,
            clientId: 0,
            plannedDate: '',
            actualDate: undefined,
            status: BuybackStatus.PLANNED,
            notes: '',
            items: [],
        },
        validate: {
            originalSaleId: (value) => (value > 0 ? null : 'Выберите продажу'),
            clientId: (value) => (value > 0 ? null : 'Выберите клиента'),
            plannedDate: (value) => (value ? null : 'Укажите планируемую дату'),
            items: (value) => (value.length > 0 ? null : 'Добавьте хотя бы один товар'),
        },
    });
    const editForm = useForm({
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
        mutationFn: (dto) => buybacksService.create(dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать выкуп',
                color: 'red',
            });
        },
    });
    const completeMutation = useMutation({
        mutationFn: ({ id, actualDate }) => buybacksService.complete(id, actualDate),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Выкуп завершён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['buybacks'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось завершить выкуп',
                color: 'red',
            });
        },
    });
    const declineMutation = useMutation({
        mutationFn: (id) => buybacksService.decline(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Выкуп отклонён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['buybacks'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось отклонить выкуп',
                color: 'red',
            });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }) => buybacksService.update(id, dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось обновить выкуп',
                color: 'red',
            });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => buybacksService.delete(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Выкуп удалён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['buybacks'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить выкуп',
                color: 'red',
            });
        },
    });
    const handleSaleChange = (saleId) => {
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
    const removeItem = (index) => {
        form.removeListItem('items', index);
    };
    const handleSubmit = (values) => {
        createMutation.mutate(values);
    };
    const getStatusColor = (status) => {
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
    const getStatusLabel = (status) => {
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
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    const saleOptions = sales?.map((sale) => ({
        value: sale.id.toString(),
        label: `Продажа #${sale.id} - ${sale.client.fullName} (${formatDate(sale.saleDate)})`,
    })) || [];
    const clientOptions = clients?.map((client) => ({
        value: client.id.toString(),
        label: client.fullName,
    })) || [];
    const selectedSale = sales?.find((s) => s.id === form.values.originalSaleId);
    const saleItemOptions = selectedSale?.items.map((item) => ({
        value: item.id.toString(),
        label: `${item.batch.plantType} (${item.batch.sizeCmMin}-${item.batch.sizeCmMax}см) - ${item.quantity} шт`,
    })) || [];
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u0412\u044B\u043A\u0443\u043F" }), _jsx(Text, { c: "dimmed", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u044B\u043A\u0443\u043F\u0430\u043C\u0438 \u0438 \u043A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u0441\u0440\u043E\u043A\u043E\u0432" })] }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432\u044B\u043A\u0443\u043F" })] }), _jsx(Tabs, { value: statusFilter, onChange: (value) => setStatusFilter(value), children: _jsxs(Tabs.List, { children: [_jsx(Tabs.Tab, { value: "all", children: "\u0412\u0441\u0435" }), _jsx(Tabs.Tab, { value: BuybackStatus.PLANNED, children: "\u0417\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435" }), _jsx(Tabs.Tab, { value: BuybackStatus.CONTACTED, children: "\u0421\u0432\u044F\u0437\u0430\u043B\u0438\u0441\u044C" }), _jsx(Tabs.Tab, { value: BuybackStatus.COMPLETED, children: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D\u043D\u044B\u0435" }), _jsx(Tabs.Tab, { value: BuybackStatus.DECLINED, children: "\u041E\u0442\u043A\u043B\u043E\u043D\u0451\u043D\u043D\u044B\u0435" })] }) }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: buybacks?.map((buyback) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", buyback.id] }), _jsx(Table.Td, { children: buyback.client.fullName }), _jsx(Table.Td, { children: formatDate(buyback.plannedDate) }), _jsx(Table.Td, { children: buyback.actualDate ? formatDate(buyback.actualDate) : '-' }), _jsx(Table.Td, { children: buyback.items.length }), _jsx(Table.Td, { children: _jsx(Badge, { color: getStatusColor(buyback.status), variant: "light", children: getStatusLabel(buyback.status) }) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                setSelectedBuyback(buyback);
                                                                setViewModalOpened(true);
                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "yellow", onClick: () => {
                                                                setBuybackToEdit(buyback);
                                                                editForm.setValues({
                                                                    plannedDate: buyback.plannedDate,
                                                                    actualDate: buyback.actualDate ?? '',
                                                                    status: buyback.status,
                                                                    notes: buyback.notes ?? '',
                                                                });
                                                                setEditModalOpened(true);
                                                            }, children: _jsx(IconEdit, { size: 16 }) }) }), buyback.status === BuybackStatus.COMPLETED && (_jsx(Tooltip, { label: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0430\u043A\u0442", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: async () => {
                                                                try {
                                                                    await downloadPdf(`/buybacks/${buyback.id}/act`, `buyback-act-${buyback.id}.pdf`);
                                                                    notifications.show({
                                                                        title: 'Успешно',
                                                                        message: 'Акт скачан',
                                                                        color: 'green',
                                                                    });
                                                                }
                                                                catch (error) {
                                                                    notifications.show({
                                                                        title: 'Ошибка',
                                                                        message: 'Не удалось скачать акт',
                                                                        color: 'red',
                                                                    });
                                                                }
                                                            }, children: _jsx(IconFileDownload, { size: 16 }) }) })), buyback.status !== BuybackStatus.COMPLETED &&
                                                        buyback.status !== BuybackStatus.DECLINED && (_jsxs(_Fragment, { children: [_jsx(Tooltip, { label: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "green", onClick: () => completeMutation.mutate({ id: buyback.id }), children: _jsx(IconCheck, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => declineMutation.mutate(buyback.id), children: _jsx(IconX, { size: 16 }) }) })] })), buyback.status === BuybackStatus.DECLINED && isAdmin && (_jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => {
                                                                if (window.confirm('Вы уверены, что хотите удалить этот отменённый выкуп?')) {
                                                                    deleteMutation.mutate(buyback.id);
                                                                }
                                                            }, children: _jsx(IconTrash, { size: 16 }) }) }))] }) })] }, buyback.id))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        form.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432\u044B\u043A\u0443\u043F", centered: true, size: "xl", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u041F\u0440\u043E\u0434\u0430\u0436\u0430", required: true, data: saleOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0434\u0430\u0436\u0443", value: form.values.originalSaleId.toString(), onChange: (value) => {
                                        const saleId = value ? parseInt(value) : 0;
                                        form.setFieldValue('originalSaleId', saleId);
                                        handleSaleChange(saleId);
                                    }, error: form.errors.originalSaleId }), _jsx(Select, { label: "\u041A\u043B\u0438\u0435\u043D\u0442", required: true, data: clientOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430", value: form.values.clientId.toString(), onChange: (value) => form.setFieldValue('clientId', value ? parseInt(value) : 0), error: form.errors.clientId }), _jsx(TextInput, { label: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0434\u0430\u0442\u0430", type: "date", required: true, ...form.getInputProps('plannedDate') }), _jsx(TextInput, { label: "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0434\u0430\u0442\u0430 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", type: "date", ...form.getInputProps('actualDate') }), _jsx(Select, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", data: [
                                        { value: BuybackStatus.PLANNED, label: 'Запланирован' },
                                        { value: BuybackStatus.CONTACTED, label: 'Связались' },
                                    ], value: form.values.status, onChange: (value) => form.setFieldValue('status', value) }), _jsx(Textarea, { label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438", rows: 3, ...form.getInputProps('notes') }), _jsxs(Group, { justify: "space-between", mt: "md", children: [_jsx(Text, { fw: 500, children: "\u0422\u043E\u0432\u0430\u0440\u044B" }), _jsx(Button, { size: "xs", onClick: addItem, disabled: !selectedSale, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u043E\u0432\u0430\u0440" })] }), form.values.items.map((item, index) => (_jsxs(Paper, { withBorder: true, p: "md", children: [_jsxs(Group, { children: [_jsx(Select, { label: "\u0422\u043E\u0432\u0430\u0440 \u0438\u0437 \u043F\u0440\u043E\u0434\u0430\u0436\u0438", required: true, data: saleItemOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u043E\u0432\u0430\u0440", value: item.originalSaleItemId.toString(), onChange: (value) => form.setFieldValue(`items.${index}.originalSaleItemId`, value ? parseInt(value) : 0), style: { flex: 1 } }), _jsx(NumberInput, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, min: 1, ...form.getInputProps(`items.${index}.quantity`), style: { width: 120 } }), _jsx(NumberInput, { label: "\u0426\u0435\u043D\u0430 \u0432\u044B\u043A\u0443\u043F\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443", required: true, min: 0, decimalScale: 2, ...form.getInputProps(`items.${index}.buybackPricePerUnit`), style: { width: 150 } }), _jsx(ActionIcon, { color: "red", variant: "subtle", onClick: () => removeItem(index), mt: "xl", children: _jsx(IconX, { size: 16 }) })] }), _jsx(Textarea, { label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438 \u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0438", rows: 2, mt: "sm", ...form.getInputProps(`items.${index}.conditionNotes`) })] }, index))), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setSelectedBuyback(null);
                    }, title: `Выкуп #${selectedBuyback?.id ?? ''}`, centered: true, size: "xl", children: isLoadingDetails || !buybackDetails ? (_jsx(LoadingSpinner, { fullHeight: false })) : (_jsxs(Stack, { gap: "md", children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsxs(Group, { justify: "space-between", align: "flex-start", children: [_jsxs(Stack, { gap: 4, children: [_jsx(Text, { size: "sm", c: "dimmed", children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Text, { fw: 600, children: buybackDetails.client.fullName }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["\u041F\u0440\u043E\u0434\u0430\u0436\u0430 #", buybackDetails.originalSale.id, " \u043E\u0442", ' ', formatDate(buybackDetails.originalSale.saleDate)] })] }), _jsxs(Stack, { gap: 4, ta: "right", children: [_jsx(Text, { size: "sm", c: "dimmed", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Badge, { color: getStatusColor(buybackDetails.status), variant: "light", children: getStatusLabel(buybackDetails.status) })] })] }), _jsx(Table, { mt: "md", children: _jsxs(Table.Tbody, { children: [_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Table.Td, { children: formatDate(buybackDetails.plannedDate) })] }), _jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0434\u0430\u0442\u0430" }), _jsx(Table.Td, { children: buybackDetails.actualDate
                                                                ? formatDate(buybackDetails.actualDate)
                                                                : '—' })] }), buybackDetails.notes && (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438" }), _jsx(Table.Td, { children: buybackDetails.notes })] }))] }) })] }), _jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Title, { order: 5, mb: "xs", children: "\u0422\u043E\u0432\u0430\u0440\u044B" }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0420\u0430\u0441\u0442\u0435\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0426\u0435\u043D\u0430 \u0432\u044B\u043A\u0443\u043F\u0430" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" })] }) }), _jsx(Table.Tbody, { children: buybackDetails.items.map((item) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: item.originalSaleItem.batch.plantType }), _jsx(Table.Td, { children: item.quantity }), _jsx(Table.Td, { children: formatCurrency(item.buybackPricePerUnit) }), _jsx(Table.Td, { children: formatCurrency((Number(item.buybackPricePerUnit) || 0) * item.quantity) })] }, item.id))) })] })] })] })) }), _jsx(MantineModal, { opened: editModalOpened, onClose: () => {
                        setEditModalOpened(false);
                        setBuybackToEdit(null);
                        editForm.reset();
                    }, title: `Редактировать выкуп #${buybackToEdit?.id ?? ''}`, centered: true, size: "lg", children: _jsx("form", { onSubmit: editForm.onSubmit((values) => {
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
                        }), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C\u0430\u044F \u0434\u0430\u0442\u0430", type: "date", required: true, ...editForm.getInputProps('plannedDate') }), _jsx(TextInput, { label: "\u0424\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0434\u0430\u0442\u0430", type: "date", ...editForm.getInputProps('actualDate') }), _jsx(Select, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", data: [
                                        { value: BuybackStatus.PLANNED, label: 'Запланирован' },
                                        { value: BuybackStatus.CONTACTED, label: 'Связались' },
                                        { value: BuybackStatus.COMPLETED, label: 'Завершён' },
                                        { value: BuybackStatus.DECLINED, label: 'Отклонён' },
                                    ], value: editForm.values.status, onChange: (value) => editForm.setFieldValue('status', value || BuybackStatus.PLANNED) }), _jsx(Textarea, { label: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438", rows: 3, ...editForm.getInputProps('notes') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setEditModalOpened(false);
                                                setBuybackToEdit(null);
                                                editForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: updateMutation.isPending, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] })] }) }) })] }) }));
}
