import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Badge, Group, Button, Modal as MantineModal, TextInput, NumberInput, Textarea, Select, ActionIcon, Tooltip, Divider, } from '@mantine/core';
import { IconPlus, IconRefresh, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { inventoryService } from '../services/inventory.service';
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
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [viewMode, setViewMode] = useLocalStorage({
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
    const form = useForm({
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
        mutationFn: (dto) => inventoryService.createWriteOff(dto),
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
        onError: (error) => {
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
                message: result.updatedCount > 0
                    ? `Обновлено партий: ${result.updatedCount}`
                    : 'Все остатки уже были актуальны',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось пересчитать остатки',
                color: 'red',
            });
        },
    });
    const handleSubmit = (values) => {
        createWriteOffMutation.mutate(values);
    };
    const handleRecalculate = () => {
        if (window.confirm('Пересчитать складские остатки на основе фактических продаж и списаний? Это действие обновит текущие количества.')) {
            recalculateMutation.mutate();
        }
    };
    const { data: batchDetails, isFetching: isLoadingDetails } = useQuery({
        queryKey: ['batchDetails', selectedBatchId],
        queryFn: () => inventoryService.getBatchDetails(selectedBatchId),
        enabled: detailsOpened && selectedBatchId !== null,
    });
    const openDetails = (batchId) => {
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
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u0421\u043A\u043B\u0430\u0434" }), _jsx(Text, { c: "dimmed", children: "\u041E\u0441\u0442\u0430\u0442\u043A\u0438 \u0442\u043E\u0432\u0430\u0440\u043E\u0432 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u0435" })] }), _jsxs(Group, { gap: "sm", children: [isAdmin && (_jsx(Button, { variant: "outline", color: "red", leftSection: _jsx(IconRefresh, { size: 16 }), onClick: handleRecalculate, loading: recalculateMutation.isPending, children: "\u041F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043E\u0441\u0442\u0430\u0442\u043A\u0438" })), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: () => setOpened(true), disabled: availableBatches.length === 0, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435" })] })] }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID \u043F\u0430\u0440\u0442\u0438\u0438" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F \u0440\u0430\u0441\u0442\u0435\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0420\u0430\u0437\u043C\u0435\u0440 (\u0441\u043C)" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F \u0433\u043E\u0440\u0448\u043A\u0430" }), _jsx(Table.Th, { children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u043F\u043E\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E" }), _jsx(Table.Th, { children: "\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: inventory?.map((item) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", item.batchId] }), _jsx(Table.Td, { children: item.plantType }), _jsxs(Table.Td, { children: [item.sizeCmMin, "-", item.sizeCmMax] }), _jsx(Table.Td, { children: item.potType }), _jsx(Table.Td, { children: item.supplierName }), _jsx(Table.Td, { children: formatDate(item.arrivalDate) }), _jsx(Table.Td, { children: item.quantityInitial }), _jsx(Table.Td, { children: _jsx(Badge, { color: item.quantityCurrent > 0 ? 'green' : 'red', variant: "light", children: item.quantityCurrent }) }), _jsx(Table.Td, { children: formatCurrency(item.purchasePricePerUnit) }), _jsx(Table.Td, { children: _jsx(Tooltip, { label: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435", children: _jsx(ActionIcon, { variant: "subtle", color: "green", onClick: () => openDetails(item.batchId), children: _jsx(IconEye, { size: 16 }) }) }) })] }, item.batchId))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        form.reset();
                    }, title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435", centered: true, size: "lg", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(Select, { label: "\u041F\u0430\u0440\u0442\u0438\u044F", required: true, data: availableBatches.map((item) => ({
                                        value: item.batchId.toString(),
                                        label: `${item.plantType} (${item.sizeCmMin}-${item.sizeCmMax}см, ${item.potType}) - ${item.quantityCurrent} шт`,
                                    })), searchable: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0430\u0440\u0442\u0438\u044E", value: form.values.batchId.toString(), onChange: (value) => form.setFieldValue('batchId', value ? parseInt(value) : 0), error: form.errors.batchId }), _jsx(NumberInput, { label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E", required: true, min: 1, max: availableBatches.find((item) => item.batchId === form.values.batchId)?.quantityCurrent || 0, ...form.getInputProps('quantity') }), _jsx(TextInput, { label: "\u0414\u0430\u0442\u0430 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F", type: "date", required: true, ...form.getInputProps('writeOffDate') }), _jsx(Textarea, { label: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F", required: true, rows: 3, ...form.getInputProps('reason') }), _jsx(Textarea, { label: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439", rows: 2, ...form.getInputProps('comment') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createWriteOffMutation.isPending, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }) }), _jsx(MantineModal, { opened: detailsOpened, onClose: closeDetails, title: `Информация о партии #${selectedBatchId ?? ''}`, centered: true, size: "xl", children: isLoadingDetails || !batchDetails ? (_jsx(LoadingSpinner, { fullHeight: false })) : (_jsxs(Stack, { gap: "md", children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsxs(Group, { justify: "space-between", align: "flex-start", children: [_jsxs(Stack, { gap: 4, children: [_jsx(Title, { order: 4, children: batchDetails.batch.plantType }), _jsxs(Text, { size: "sm", c: "dimmed", children: [batchDetails.batch.sizeCmMin, "-", batchDetails.batch.sizeCmMax, " \u0441\u043C \u00B7", ' ', batchDetails.batch.potType] })] }), _jsxs(Stack, { gap: 4, ta: "right", children: [_jsx(Text, { size: "sm", c: "dimmed", children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A" }), _jsx(Text, { fw: 600, children: batchDetails.supplier.name }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["\u0414\u0430\u0442\u0430 \u043F\u0440\u0438\u0431\u044B\u0442\u0438\u044F: ", formatDate(batchDetails.shipment.arrivalDate)] })] })] }), _jsx(Divider, { my: "sm" }), _jsxs(Group, { justify: "space-between", align: "center", children: [_jsxs(Text, { size: "sm", component: "div", children: ["\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E: ", _jsx("strong", { children: batchDetails.batch.quantityInitial })] }), _jsxs(Group, { gap: "xs", align: "center", children: [_jsx(Text, { size: "sm", component: "span", children: "\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E:" }), _jsx(Badge, { size: "m", color: "green", variant: "light", children: batchDetails.stats.availableQuantity })] }), _jsxs(Text, { size: "sm", component: "div", children: ["\u0426\u0435\u043D\u0430 \u0437\u0430\u043A\u0443\u043F\u043A\u0438: ", formatCurrency(batchDetails.batch.purchasePricePerUnit)] })] })] }), _jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Title, { order: 5, mb: "xs", children: "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F" }), _jsx(Table, { children: _jsxs(Table.Tbody, { children: [_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u041F\u0440\u043E\u0434\u0430\u043D\u043E" }), _jsxs(Table.Td, { children: [batchDetails.stats.soldQuantity, " \u0448\u0442"] })] }), _jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E" }), _jsxs(Table.Td, { children: [batchDetails.stats.cancelledQuantity, " \u0448\u0442"] })] }), _jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u044F" }), _jsxs(Table.Td, { children: [batchDetails.stats.writeOffQuantity, " \u0448\u0442"] })] })] }) })] }), _jsxs(Stack, { children: [_jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Title, { order: 5, mb: "xs", children: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u0430\u0436\u0438" }), batchDetails.recentSales.length === 0 ? (_jsx(Text, { size: "sm", c: "dimmed", children: "\u041F\u0440\u043E\u0434\u0430\u0436 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" })) : (_jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B-\u0432\u043E" }), _jsx(Table.Th, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx(Table.Tbody, { children: batchDetails.recentSales.map((sale) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", sale.saleId] }), _jsx(Table.Td, { children: formatDate(sale.saleDate) }), _jsx(Table.Td, { children: sale.clientName }), _jsx(Table.Td, { children: sale.quantity }), _jsx(Table.Td, { children: _jsx(Badge, { color: sale.status === 'completed' ? 'green' : 'yellow', variant: "light", children: sale.status === 'completed' ? 'Завершена' : 'Отменена' }) })] }, sale.saleId))) })] }))] }), _jsxs(Paper, { withBorder: true, p: "md", children: [_jsx(Title, { order: 5, mb: "xs", children: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F" }), batchDetails.recentWriteOffs.length === 0 ? (_jsx(Text, { size: "sm", c: "dimmed", children: "\u0421\u043F\u0438\u0441\u0430\u043D\u0438\u0439 \u043D\u0435\u0442" })) : (_jsxs(Table, { children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430" }), _jsx(Table.Th, { children: "\u041A\u043E\u043B-\u0432\u043E" }), _jsx(Table.Th, { children: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430" })] }) }), _jsx(Table.Tbody, { children: batchDetails.recentWriteOffs.map((writeOff) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: formatDate(writeOff.writeOffDate) }), _jsx(Table.Td, { children: writeOff.quantity }), _jsx(Table.Td, { children: writeOff.reason })] }, writeOff.id))) })] }))] })] })] })) })] }) }));
}
