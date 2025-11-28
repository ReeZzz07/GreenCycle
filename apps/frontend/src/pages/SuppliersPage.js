import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, TextInput, ActionIcon, Tooltip, Modal as MantineModal, Textarea, Divider, } from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { suppliersService } from '../services/suppliers.service';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
export function SuppliersPage() {
    const [opened, setOpened] = useState(false);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [viewingSupplier, setViewingSupplier] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useLocalStorage({
        key: 'suppliers-view-mode',
        defaultValue: 'table',
    });
    const queryClient = useQueryClient();
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', search],
        queryFn: () => suppliersService.getAll(search || undefined),
    });
    const tableRef = useTableCardLabels(viewMode, [suppliers]);
    const form = useForm({
        initialValues: {
            name: '',
            contactInfo: '',
            contactPerson: '',
            phone: '',
            address: '',
            legalEntityName: '',
            inn: '',
            kpp: '',
            ogrn: '',
            bankName: '',
            bankAccount: '',
            correspondentAccount: '',
            bik: '',
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : 'Укажите название поставщика'),
        },
    });
    const createMutation = useMutation({
        mutationFn: (dto) => suppliersService.create(dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставщик создан',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setOpened(false);
            form.reset();
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать поставщика',
                color: 'red',
            });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }) => suppliersService.update(id, dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставщик обновлён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setOpened(false);
            setEditingSupplier(null);
            form.reset();
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось обновить поставщика',
                color: 'red',
            });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => suppliersService.delete(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Поставщик удалён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить поставщика',
                color: 'red',
            });
        },
    });
    const handleOpenCreate = () => {
        setEditingSupplier(null);
        form.reset();
        setOpened(true);
    };
    const handleOpenEdit = async (id) => {
        const supplier = await suppliersService.getById(id);
        form.setValues({
            name: supplier.name,
            contactInfo: supplier.contactInfo || '',
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            legalEntityName: supplier.legalEntityName || '',
            inn: supplier.inn || '',
            kpp: supplier.kpp || '',
            ogrn: supplier.ogrn || '',
            bankName: supplier.bankName || '',
            bankAccount: supplier.bankAccount || '',
            correspondentAccount: supplier.correspondentAccount || '',
            bik: supplier.bik || '',
        });
        setEditingSupplier(id);
        setOpened(true);
    };
    const handleOpenView = async (id) => {
        const supplier = await suppliersService.getById(id);
        setViewingSupplier(supplier);
        setViewModalOpened(true);
    };
    const handleSubmit = (values) => {
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier, dto: values });
        }
        else {
            createMutation.mutate(values);
        }
    };
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0438" }), _jsx(Text, { c: "dimmed", children: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u043E\u0432 \u0438 \u0438\u0445 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B" })] }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: handleOpenCreate, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430" })] }), _jsx(TextInput, { placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430\u043C...", value: search, onChange: (e) => setSearch(e.currentTarget.value), style: { maxWidth: 400 } }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(Table.Th, { children: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0435 \u043B\u0438\u0446\u043E" }), _jsx(Table.Th, { children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: suppliers?.map((supplier) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", supplier.id] }), _jsx(Table.Td, { children: supplier.name }), _jsx(Table.Td, { children: supplier.contactPerson ? (_jsx(Text, { children: supplier.contactPerson })) : (_jsx(Text, { c: "dimmed", children: "-" })) }), _jsx(Table.Td, { children: supplier.phone ? (_jsx(Text, { children: supplier.phone })) : (_jsx(Text, { c: "dimmed", children: "-" })) }), _jsx(Table.Td, { children: formatDate(supplier.createdAt) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => handleOpenView(supplier.id), children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: () => handleOpenEdit(supplier.id), children: _jsx(IconEdit, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteMutation.mutate(supplier.id), children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, supplier.id))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        setEditingSupplier(null);
                        form.reset();
                    }, title: editingSupplier ? 'Редактировать поставщика' : 'Создать поставщика', centered: true, size: "xl", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430", required: true, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", ...form.getInputProps('name') }), _jsx(Divider, { label: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", labelPosition: "left" }), _jsx(TextInput, { label: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0435 \u043B\u0438\u0446\u043E", placeholder: "\u0424\u0418\u041E \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0433\u043E \u043B\u0438\u0446\u0430", ...form.getInputProps('contactPerson') }), _jsx(TextInput, { label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", placeholder: "+7 (999) 123-45-67", ...form.getInputProps('phone') }), _jsx(Textarea, { label: "\u0410\u0434\u0440\u0435\u0441", placeholder: "\u041F\u043E\u043B\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0430", minRows: 2, ...form.getInputProps('address') }), _jsx(Textarea, { label: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", placeholder: "Email, \u0434\u0440\u0443\u0433\u0438\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u0438 \u0442.\u0434.", minRows: 2, ...form.getInputProps('contactInfo') }), _jsx(Divider, { label: "\u0414\u0430\u043D\u043D\u044B\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", labelPosition: "left" }), _jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", placeholder: "\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", ...form.getInputProps('legalEntityName') }), _jsxs(Group, { grow: true, children: [_jsx(TextInput, { label: "\u0418\u041D\u041D", placeholder: "10 \u0438\u043B\u0438 12 \u0446\u0438\u0444\u0440", ...form.getInputProps('inn') }), _jsx(TextInput, { label: "\u041A\u041F\u041F", placeholder: "9 \u0446\u0438\u0444\u0440", ...form.getInputProps('kpp') })] }), _jsx(TextInput, { label: "\u041E\u0413\u0420\u041D", placeholder: "13 \u0438\u043B\u0438 15 \u0446\u0438\u0444\u0440", ...form.getInputProps('ogrn') }), _jsx(Divider, { label: "\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B", labelPosition: "left" }), _jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430", placeholder: "\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430", ...form.getInputProps('bankName') }), _jsxs(Group, { grow: true, children: [_jsx(TextInput, { label: "\u0420\u0430\u0441\u0447\u0435\u0442\u043D\u044B\u0439 \u0441\u0447\u0435\u0442", placeholder: "20 \u0446\u0438\u0444\u0440", ...form.getInputProps('bankAccount') }), _jsx(TextInput, { label: "\u041A\u043E\u0440\u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0441\u0447\u0435\u0442", placeholder: "20 \u0446\u0438\u0444\u0440", ...form.getInputProps('correspondentAccount') })] }), _jsx(TextInput, { label: "\u0411\u0418\u041A", placeholder: "9 \u0446\u0438\u0444\u0440", ...form.getInputProps('bik') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                setEditingSupplier(null);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending || updateMutation.isPending, children: editingSupplier ? 'Сохранить' : 'Создать' })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setViewingSupplier(null);
                    }, title: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043F\u043E\u0441\u0442\u0430\u0432\u0449\u0438\u043A\u0435", centered: true, size: "lg", children: viewingSupplier && (_jsxs(Stack, { children: [_jsx(Paper, { withBorder: true, p: "md", children: _jsxs(Stack, { gap: "md", children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "ID" }), _jsxs(Text, { fw: 500, children: ["#", viewingSupplier.id] })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(Text, { fw: 500, children: viewingSupplier.name })] }), _jsx(Divider, { label: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F", labelPosition: "left" }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0435 \u043B\u0438\u0446\u043E" }), _jsx(Text, { fw: 500, children: viewingSupplier.contactPerson || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx(Text, { fw: 500, children: viewingSupplier.phone || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0410\u0434\u0440\u0435\u0441" }), _jsx(Text, { fw: 500, children: viewingSupplier.address || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsx(Text, { fw: 500, children: viewingSupplier.contactInfo || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsx(Divider, { label: "\u0414\u0430\u043D\u043D\u044B\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", labelPosition: "left" }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430" }), _jsx(Text, { fw: 500, children: viewingSupplier.legalEntityName || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs(Group, { grow: true, children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0418\u041D\u041D" }), _jsx(Text, { fw: 500, children: viewingSupplier.inn || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041A\u041F\u041F" }), _jsx(Text, { fw: 500, children: viewingSupplier.kpp || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041E\u0413\u0420\u041D" }), _jsx(Text, { fw: 500, children: viewingSupplier.ogrn || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsx(Divider, { label: "\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B", labelPosition: "left" }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430" }), _jsx(Text, { fw: 500, children: viewingSupplier.bankName || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs(Group, { grow: true, children: [_jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0420\u0430\u0441\u0447\u0435\u0442\u043D\u044B\u0439 \u0441\u0447\u0435\u0442" }), _jsx(Text, { fw: 500, children: viewingSupplier.bankAccount || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041A\u043E\u0440\u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0441\u0447\u0435\u0442" }), _jsx(Text, { fw: 500, children: viewingSupplier.correspondentAccount || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0411\u0418\u041A" }), _jsx(Text, { fw: 500, children: viewingSupplier.bik || (_jsx(Text, { c: "dimmed", fs: "italic", children: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E" })) })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Text, { fw: 500, children: formatDate(viewingSupplier.createdAt) })] }), _jsxs("div", { children: [_jsx(Text, { size: "sm", c: "dimmed", mb: 4, children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435" }), _jsx(Text, { fw: 500, children: formatDate(viewingSupplier.updatedAt) })] })] }) }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                            setViewModalOpened(false);
                                            setViewingSupplier(null);
                                        }, children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }), _jsx(Button, { onClick: () => {
                                            setViewModalOpened(false);
                                            handleOpenEdit(viewingSupplier.id);
                                        }, children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] })) })] }) }));
}
