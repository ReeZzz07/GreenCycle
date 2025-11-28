import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, Badge, ActionIcon, Tooltip, Modal as MantineModal, Select, NumberInput, TextInput, Alert, } from '@mantine/core';
import { IconPlus, IconEye, IconX, IconFileDownload, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { salesService } from '../services/sales.service';
import { clientsService } from '../services/clients.service';
import { inventoryService } from '../services/inventory.service';
import { financeService } from '../services/finance.service';
import { ClientType } from '../types/clients';
import { formatCurrency, formatDate } from '../utils/format';
import { downloadPdf } from '../utils/pdf';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
export function SalesPage() {
    const [opened, setOpened] = useState(false);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [clientModalOpened, setClientModalOpened] = useState(false);
    const [viewMode, setViewMode] = useLocalStorage({
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
        queryFn: () => salesService.getById(selectedSale.id),
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
    const form = useForm({
        initialValues: {
            clientId: 0,
            saleDate: new Date().toISOString().split('T')[0],
            items: [],
            accountId: undefined,
        },
        validate: {
            clientId: (value) => (value > 0 ? null : 'Выберите клиента'),
            saleDate: (value) => (value ? null : 'Укажите дату продажи'),
            items: (value) => (value.length > 0 ? null : 'Добавьте хотя бы один товар'),
            accountId: (value) => (value && value > 0 ? null : 'Выберите счёт для поступления средств'),
        },
    });
    const clientForm = useForm({
        initialValues: {
            fullName: '',
            phone: '',
            email: '',
            addressFull: '',
            clientType: ClientType.INDIVIDUAL,
        },
        validate: {
            fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО клиента'),
            email: (value) => value && value.length > 0 && !/^\S+@\S+$/.test(value) ? 'Некорректный email' : null,
        },
    });
    const createMutation = useMutation({
        mutationFn: (dto) => salesService.create(dto),
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать продажу',
                color: 'red',
            });
        },
    });
    const createClientMutation = useMutation({
        mutationFn: (dto) => clientsService.create(dto),
        onSuccess: (newClient) => {
            queryClient.setQueryData(['clients'], (oldData) => {
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
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать клиента',
                color: 'red',
            });
        },
    });
    const cancelMutation = useMutation({
        mutationFn: (id) => salesService.cancel(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Продажа отменена',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось отменить продажу',
                color: 'red',
            });
        },
    });
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => salesService.updateStatus(id, status),
        onSuccess: (_, variables) => {
            notifications.show({
                title: 'Успешно',
                message: variables.status === 'completed'
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
                setSelectedSale((prev) => prev ? { ...prev, status: variables.status } : null);
            }
        },
        onError: (error) => {
            let errorMessage = 'Не удалось изменить статус продажи';
            if (error.response?.data?.error) {
                if (typeof error.response.data.error === 'string') {
                    errorMessage = error.response.data.error;
                }
                else if (error.response.data.error.message) {
                    errorMessage = error.response.data.error.message;
                }
            }
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
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
    const deleteSaleMutation = useMutation({
        mutationFn: (id) => salesService.delete(id),
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
        onError: (error) => {
            let errorMessage = 'Не удалось удалить продажу';
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
    const addItem = () => {
        form.insertListItem('items', {
            batchId: 0,
            quantity: 1,
            salePricePerUnit: 0,
        });
    };
    const removeItem = (index) => {
        form.removeListItem('items', index);
    };
    const handleSubmit = (values) => {
        createMutation.mutate(values);
    };
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    const availableBatches = inventory?.filter((item) => item.quantityCurrent > 0) || [];
    const clientOptions = clients?.map((client) => ({
        value: client.id.toString(),
        label: client.fullName,
    })) || [];
    const batchOptions = availableBatches.map((item) => ({
        value: item.batchId.toString(),
        label: `${item.plantType} (${item.sizeCmMin}-${item.sizeCmMax}см, ${item.potType}) - ${item.quantityCurrent} шт`,
    }));
    const accountOptions = accounts?.map((account) => ({
        value: account.id.toString(),
        label: `${account.name} (${account.type === 'cash' ? 'Наличные' : account.type === 'bank' ? 'Банк' : 'Прочее'})`,
    })) || [];
    const totalAmount = form.values.items.reduce((sum, item) => {
        return sum + item.quantity * item.salePricePerUnit;
    }, 0);
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438" }), _jsx(Text, { c: "dimmed", children: "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0430\u0436 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F" })] }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setOpened(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443" })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0438" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: sales?.map((sale) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", sale.id] }), _jsx(Table.Td, { children: sale.client.fullName }), _jsx(Table.Td, { children: formatDate(sale.saleDate) }), _jsx(Table.Td, { children: sale.items.length }), _jsx(Table.Td, { children: formatCurrency(sale.totalAmount) }), _jsx(Table.Td, { children: _jsx(Badge, { color: sale.status === 'completed' ? 'green' : 'red', variant: "light", children: sale.status === 'completed' ? 'Завершена' : 'Отменена' }) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                setSelectedSale(sale);
                                                                setViewModalOpened(true);
                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), sale.status === 'completed' && (_jsxs(_Fragment, { children: [_jsx(Tooltip, { label: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0441\u0447\u0451\u0442", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: async () => {
                                                                        try {
                                                                            await downloadPdf(`/sales/${sale.id}/invoice`, `invoice-${sale.id}.pdf`);
                                                                            notifications.show({
                                                                                title: 'Успешно',
                                                                                message: 'Счёт скачан',
                                                                                color: 'green',
                                                                            });
                                                                        }
                                                                        catch (error) {
                                                                            notifications.show({
                                                                                title: 'Ошибка',
                                                                                message: 'Не удалось скачать счёт',
                                                                                color: 'red',
                                                                            });
                                                                        }
                                                                    }, children: _jsx(IconFileDownload, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => cancelMutation.mutate(sale.id), children: _jsx(IconX, { size: 16 }) }) })] }))] }) })] }, sale.id))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        form.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443", centered: true, size: "xl", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsxs(Stack, { gap: 4, children: [_jsxs(Group, { align: "flex-end", gap: "xs", children: [_jsx(Select, { label: "\u041A\u043B\u0438\u0435\u043D\u0442", required: true, data: clientOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430", value: form.values.clientId.toString(), onChange: (value) => form.setFieldValue('clientId', value ? parseInt(value) : 0), error: form.errors.clientId, style: { flex: 1 } }), _jsx(Button, { variant: "light", size: "xs", onClick: () => setClientModalOpened(true), style: { marginBottom: '4px' }, children: _jsx(IconPlus, { size: 16 }) })] }), _jsx(Text, { size: "xs", c: "dimmed", children: "\u0415\u0441\u043B\u0438 \u043A\u043B\u0438\u0435\u043D\u0442\u0430 \u0435\u0449\u0451 \u043D\u0435\u0442 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435, \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0447\u0435\u0440\u0435\u0437 \u043A\u043D\u043E\u043F\u043A\u0443 \u00AB+\u00BB. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0432 \u0440\u0430\u0437\u0434\u0435\u043B\u0435 \u00AB\u041A\u043B\u0438\u0435\u043D\u0442\u044B\u00BB." })] }), _jsx(TextInput, { label: "\u0414\u0430\u0442\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0438", type: "date", required: true, ...form.getInputProps('saleDate') }), _jsx(Select, { label: "\u0421\u0447\u0451\u0442 \u0434\u043B\u044F \u043F\u043E\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0435\u0434\u0441\u0442\u0432", required: true, data: accountOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0447\u0451\u0442", value: form.values.accountId?.toString() || '', onChange: (value) => form.setFieldValue('accountId', value ? parseInt(value) : undefined), error: form.errors.accountId, description: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0447\u0451\u0442, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u0441\u0442\u0443\u043F\u044F\u0442 \u0441\u0440\u0435\u0434\u0441\u0442\u0432\u0430 \u043E\u0442 \u043F\u0440\u043E\u0434\u0430\u0436\u0438" }), _jsxs(Group, { justify: "space-between", mt: "md", children: [_jsx(Text, { fw: 500, children: "\u0422\u043E\u0432\u0430\u0440\u044B" }), _jsx(Button, { size: "xs", onClick: addItem, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u043E\u0432\u0430\u0440" })] }), form.values.items.map((item, index) => (_jsx(Paper, { withBorder: true, p: "md", children: _jsxs(Group, { children: [_jsx(Select, { label: "\u041F\u0430\u0440\u0442\u0438\u044F", required: true, data: batchOptions, searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u0440\u0442\u0438\u044E", value: item.batchId.toString(), onChange: (value) => form.setFieldValue(`items.${index}.batchId`, value ? parseInt(value) : 0), style: { flex: 1 } }), _jsx(NumberInput, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, min: 1, ...form.getInputProps(`items.${index}.quantity`), style: { width: 120 } }), _jsx(NumberInput, { label: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443", required: true, min: 0, decimalScale: 2, ...form.getInputProps(`items.${index}.salePricePerUnit`), style: { width: 150 } }), _jsx(ActionIcon, { color: "red", variant: "subtle", onClick: () => removeItem(index), mt: "xl", children: _jsx(IconX, { size: 16 }) })] }) }, index))), _jsx(Paper, { withBorder: true, p: "md", mt: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fw: 500, children: "\u0418\u0442\u043E\u0433\u043E:" }), _jsx(Text, { fw: 700, size: "lg", children: formatCurrency(totalAmount) })] }) }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: clientModalOpened, onClose: () => {
                        setClientModalOpened(false);
                        clientForm.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430", centered: true, children: _jsx("form", { onSubmit: clientForm.onSubmit((values) => {
                            // Преобразуем пустые строки в undefined для опциональных полей
                            const cleanValues = {
                                fullName: values.fullName.trim(),
                                addressFull: values.addressFull?.trim() || undefined,
                                phone: values.phone?.trim() || undefined,
                                email: values.email?.trim() || undefined,
                                clientType: values.clientType || ClientType.INDIVIDUAL,
                            };
                            createClientMutation.mutate(cleanValues);
                        }), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u0424\u0418\u041E \u043A\u043B\u0438\u0435\u043D\u0442\u0430", required: true, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0424\u0418\u041E", ...clientForm.getInputProps('fullName') }), _jsx(TextInput, { label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", placeholder: "+7 (999) 123-45-67", ...clientForm.getInputProps('phone') }), _jsx(TextInput, { label: "Email", placeholder: "client@example.com", ...clientForm.getInputProps('email') }), _jsx(TextInput, { label: "\u0410\u0434\u0440\u0435\u0441", placeholder: "\u0413\u043E\u0440\u043E\u0434, \u0443\u043B\u0438\u0446\u0430, \u0434\u043E\u043C (\u043C\u043E\u0436\u043D\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u043E\u0437\u0436\u0435)", ...clientForm.getInputProps('addressFull') }), _jsx(Alert, { variant: "light", color: "blue", title: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", styles: {
                                        root: {
                                            backgroundColor: 'var(--mantine-color-blue-0)',
                                        },
                                    }, children: _jsxs(Text, { size: "sm", children: ["\u041F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043A\u043B\u0438\u0435\u043D\u0442\u0430 \u0432\u044B \u0441\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0438 \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0432 \u0440\u0430\u0437\u0434\u0435\u043B\u0435", ' ', _jsx(Text, { component: "span", fw: 600, children: "\u00AB\u041A\u043B\u0438\u0435\u043D\u0442\u044B\u00BB" }), "."] }) }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setClientModalOpened(false);
                                                clientForm.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createClientMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setSelectedSale(null);
                    }, title: `Продажа #${selectedSale?.id || saleDetails?.id || ''}`, centered: true, size: "xl", children: (saleDetails || selectedSale) && (_jsx(Stack, { gap: "md", children: (() => {
                            const sale = saleDetails || selectedSale;
                            const getTransactionTypeLabel = (type) => {
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
                            const getAccountTypeLabel = (type) => {
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
                            return (_jsxs(_Fragment, { children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041A\u043B\u0438\u0435\u043D\u0442:" }), _jsx(Text, { children: sale.client.fullName })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0414\u0430\u0442\u0430 \u043F\u0440\u043E\u0434\u0430\u0436\u0438:" }), _jsx(Text, { children: formatDate(sale.saleDate) })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0421\u0442\u0430\u0442\u0443\u0441:" }), _jsx(Badge, { color: sale.status === 'completed' ? 'green' : 'red', variant: "light", children: sale.status === 'completed' ? 'Завершена' : 'Отменена' })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041E\u0431\u0449\u0430\u044F \u0441\u0443\u043C\u043C\u0430:" }), _jsx(Text, { fw: 700, size: "lg", children: formatCurrency(sale.totalAmount) })] }), _jsxs("div", { children: [_jsxs(Text, { fw: 600, mb: "xs", children: ["\u0422\u043E\u0432\u0430\u0440\u044B (", sale.items.length, "):"] }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u041F\u0430\u0440\u0442\u0438\u044F" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" })] }) }), _jsx(Table.Tbody, { children: sale.items.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: [item.batch.plantType, " (", item.batch.sizeCmMin, "-", item.batch.sizeCmMax, "\u0441\u043C, ", item.batch.potType, ")"] }), _jsx(Table.Td, { children: item.quantity }), _jsx(Table.Td, { children: formatCurrency(item.salePricePerUnit) }), _jsx(Table.Td, { children: formatCurrency((item.quantity * Number(item.salePricePerUnit)).toString()) })] }, item.id))) })] })] }), sale.transaction && (_jsxs("div", { children: [_jsx(Text, { fw: 600, mb: "xs", children: "\u0424\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u0430\u044F \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F:" }), _jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0421\u0447\u0451\u0442" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" })] }) }), _jsx(Table.Tbody, { children: _jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", sale.transaction.id] }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Text, { children: sale.transaction.account.name }), _jsx(Badge, { variant: "light", size: "sm", children: getAccountTypeLabel(sale.transaction.account.type) })] }) }), _jsx(Table.Td, { children: _jsx(Badge, { variant: "light", color: sale.transaction.isCancelled ? 'red' : undefined, children: getTransactionTypeLabel(sale.transaction.type) }) }), _jsx(Table.Td, { children: _jsx(Text, { fw: 700, c: Number(sale.transaction.amount) >= 0 ? 'green' : 'red', children: formatCurrency(sale.transaction.amount) }) }), _jsx(Table.Td, { children: _jsx(Badge, { color: sale.transaction.isCancelled ? 'red' : 'green', variant: "light", children: sale.transaction.isCancelled ? 'Отменена' : 'Активна' }) }), _jsx(Table.Td, { children: formatDate(sale.transaction.createdAt) })] }) })] }), sale.transaction.description && (_jsxs(Text, { c: "dimmed", size: "sm", mt: "xs", children: ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435: ", sale.transaction.description] }))] })), !sale.transaction && sale.status === 'completed' && (_jsx(Text, { c: "dimmed", size: "sm", style: { fontStyle: 'italic' }, children: "\u0424\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u0430\u044F \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" })), _jsxs(Group, { justify: "space-between", mt: "md", children: [_jsxs("div", { children: [_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u043E: ", formatDate(sale.createdAt)] }), sale.updatedAt !== sale.createdAt && (_jsxs(Text, { c: "dimmed", size: "sm", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ", formatDate(sale.updatedAt)] }))] }), _jsx(Group, { gap: "xs", children: sale.status === 'completed' ? (_jsx(Button, { color: "red", variant: "light", onClick: () => updateStatusMutation.mutate({
                                                        id: sale.id,
                                                        status: 'cancelled',
                                                    }), loading: updateStatusMutation.isPending, children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { color: "green", variant: "light", onClick: () => updateStatusMutation.mutate({
                                                                id: sale.id,
                                                                status: 'completed',
                                                            }), loading: updateStatusMutation.isPending, children: "\u041F\u043E\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u0443\u044E" }), _jsx(Button, { color: "red", variant: "outline", leftSection: _jsx(IconTrash, { size: 16 }), onClick: () => {
                                                                if (window.confirm(sale.transaction
                                                                    ? 'Вы уверены, что хотите удалить эту продажу? Связанная транзакция будет удалена автоматически. Это действие нельзя отменить.'
                                                                    : 'Вы уверены, что хотите удалить эту продажу? Это действие нельзя отменить.')) {
                                                                    deleteSaleMutation.mutate(sale.id);
                                                                }
                                                            }, loading: deleteSaleMutation.isPending, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443" })] })) })] })] }));
                        })() })) })] }) }));
}
