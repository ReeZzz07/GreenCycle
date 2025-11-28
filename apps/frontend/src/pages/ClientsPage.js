import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, TextInput, ActionIcon, Tooltip, Badge, Modal as MantineModal, Select, Divider, Checkbox, FileButton, Alert, } from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash, IconUpload, IconAlertCircle } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { clientsService } from '../services/clients.service';
import { ClientType } from '../types/clients';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
export function ClientsPage() {
    const [opened, setOpened] = useState(false);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleteModalOpened, setBulkDeleteModalOpened] = useState(false);
    const [importModalOpened, setImportModalOpened] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [viewMode, setViewMode] = useLocalStorage({
        key: 'clients-view-mode',
        defaultValue: 'table',
    });
    const queryClient = useQueryClient();
    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients', search],
        queryFn: () => clientsService.getAll(search || undefined),
    });
    const tableRef = useTableCardLabels(viewMode, [clients]);
    const form = useForm({
        initialValues: {
            fullName: '',
            phone: '',
            email: '',
            addressFull: '',
            clientType: ClientType.INDIVIDUAL,
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
            fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО'),
            email: (value) => value && value.length > 0 && !/^\S+@\S+$/.test(value)
                ? 'Некорректный email'
                : null,
        },
    });
    const createMutation = useMutation({
        mutationFn: (dto) => clientsService.create(dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Клиент создан',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setOpened(false);
            form.reset();
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось создать клиента',
                color: 'red',
            });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }) => clientsService.update(id, dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Клиент обновлён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setOpened(false);
            setEditingClient(null);
            form.reset();
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось обновить клиента',
                color: 'red',
            });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => clientsService.delete(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Клиент удалён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить клиента',
                color: 'red',
            });
        },
    });
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => clientsService.bulkDelete(ids),
        onSuccess: (result) => {
            if (result.failedCount === 0) {
                notifications.show({
                    title: 'Успешно',
                    message: `Удалено клиентов: ${result.successCount}`,
                    color: 'green',
                });
            }
            else {
                notifications.show({
                    title: 'Частично успешно',
                    message: `Удалено: ${result.successCount}, ошибок: ${result.failedCount}`,
                    color: 'yellow',
                });
                // Показываем детали ошибок
                result.failed.forEach(({ id, error }) => {
                    notifications.show({
                        title: `Ошибка удаления клиента #${id}`,
                        message: error,
                        color: 'red',
                    });
                });
            }
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSelectedIds(new Set());
            setBulkDeleteModalOpened(false);
        },
        onError: (error) => {
            notifications.show({
                title: 'Ошибка',
                message: error.message || 'Не удалось удалить клиентов',
                color: 'red',
            });
        },
    });
    const importMutation = useMutation({
        mutationFn: (file) => clientsService.importFromExcel(file),
        onSuccess: (result) => {
            if (result.failedCount === 0) {
                notifications.show({
                    title: 'Успешно',
                    message: `Импортировано клиентов: ${result.successCount} из ${result.total}`,
                    color: 'green',
                });
            }
            else {
                notifications.show({
                    title: 'Частично успешно',
                    message: `Импортировано: ${result.successCount} из ${result.total}, ошибок: ${result.failedCount}`,
                    color: 'yellow',
                });
                // Показываем первые 5 ошибок
                result.failed.slice(0, 5).forEach(({ row, error }) => {
                    notifications.show({
                        title: `Ошибка в строке ${row}`,
                        message: error,
                        color: 'red',
                    });
                });
                if (result.failed.length > 5) {
                    notifications.show({
                        title: 'Внимание',
                        message: `И еще ${result.failed.length - 5} ошибок. Проверьте детали в модальном окне.`,
                        color: 'yellow',
                    });
                }
            }
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setImportFile(null);
            setImportModalOpened(false);
        },
        onError: (error) => {
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Не удалось импортировать клиентов';
            notifications.show({
                title: 'Ошибка',
                message: errorMessage,
                color: 'red',
            });
        },
    });
    const handleOpenCreate = () => {
        setEditingClient(null);
        form.reset();
        setOpened(true);
    };
    const handleOpenEdit = async (id) => {
        const client = await clientsService.getById(id);
        form.setValues({
            fullName: client.fullName,
            phone: client.phone || '',
            email: client.email || '',
            addressFull: client.addressFull || undefined,
            clientType: client.clientType,
            legalEntityName: client.legalEntityName || '',
            inn: client.inn || '',
            kpp: client.kpp || '',
            ogrn: client.ogrn || '',
            bankName: client.bankName || '',
            bankAccount: client.bankAccount || '',
            correspondentAccount: client.correspondentAccount || '',
            bik: client.bik || '',
        });
        setEditingClient(id);
        setOpened(true);
    };
    const handleSubmit = (values) => {
        if (editingClient) {
            // При редактировании: отправляем пустые строки для полей, которые нужно очистить.
            // На бэкенде они будут преобразованы в null через @Transform декоратор.
            const updateValues = {
                fullName: values.fullName.trim(),
                phone: values.phone?.trim() || '',
                email: values.email?.trim() || '',
                addressFull: values.addressFull?.trim() || '',
                clientType: values.clientType,
                legalEntityName: values.legalEntityName?.trim() || '',
                inn: values.inn?.trim() || '',
                kpp: values.kpp?.trim() || '',
                ogrn: values.ogrn?.trim() || '',
                bankName: values.bankName?.trim() || '',
                bankAccount: values.bankAccount?.trim() || '',
                correspondentAccount: values.correspondentAccount?.trim() || '',
                bik: values.bik?.trim() || '',
            };
            updateMutation.mutate({ id: editingClient, dto: updateValues });
        }
        else {
            // При создании: преобразуем пустые строки в undefined для опциональных полей
            const cleanValues = {
                ...values,
                phone: values.phone?.trim() || undefined,
                email: values.email?.trim() || undefined,
                addressFull: values.addressFull?.trim() || undefined,
                legalEntityName: values.legalEntityName?.trim() || undefined,
                inn: values.inn?.trim() || undefined,
                kpp: values.kpp?.trim() || undefined,
                ogrn: values.ogrn?.trim() || undefined,
                bankName: values.bankName?.trim() || undefined,
                bankAccount: values.bankAccount?.trim() || undefined,
                correspondentAccount: values.correspondentAccount?.trim() || undefined,
                bik: values.bik?.trim() || undefined,
            };
            createMutation.mutate(cleanValues);
        }
    };
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041A\u043B\u0438\u0435\u043D\u0442\u044B" }), _jsx(Text, { c: "dimmed", children: "\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 \u0438 \u0438\u0445 \u0438\u0441\u0442\u043E\u0440\u0438\u044F" })] }), _jsxs(Group, { children: [selectedIds.size > 0 && (_jsxs(Button, { color: "red", variant: "light", onClick: () => setBulkDeleteModalOpened(true), children: ["\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 (", selectedIds.size, ")"] })), _jsx(FileButton, { onChange: (file) => {
                                        if (file) {
                                            setImportFile(file);
                                            setImportModalOpened(true);
                                        }
                                    }, accept: ".xlsx,.xls", children: (props) => (_jsx(Button, { ...props, variant: "light", leftSection: _jsx(IconUpload, { size: 16 }), children: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 Excel" })) }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: handleOpenCreate, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430" })] })] }), _jsx(TextInput, { placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0424\u0418\u041E, \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443, email...", value: search, onChange: (e) => {
                        setSearch(e.currentTarget.value);
                        setSelectedIds(new Set()); // Сбрасываем выбор при изменении поиска
                    }, style: { maxWidth: 400 } }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { style: { width: 40 }, children: _jsx(Checkbox, { checked: selectedIds.size > 0 && selectedIds.size === clients?.length, indeterminate: selectedIds.size > 0 && selectedIds.size < (clients?.length || 0), onChange: (e) => {
                                                    if (e.currentTarget.checked) {
                                                        setSelectedIds(new Set(clients?.map((c) => c.id) || []));
                                                    }
                                                    else {
                                                        setSelectedIds(new Set());
                                                    }
                                                } }) }), _jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0424\u0418\u041E" }), _jsx(Table.Th, { children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx(Table.Th, { children: "Email" }), _jsx(Table.Th, { children: "\u0410\u0434\u0440\u0435\u0441" }), _jsx(Table.Th, { children: "\u0422\u0438\u043F" }), _jsx(Table.Th, { children: "\u041F\u0435\u0440\u0432\u0430\u044F \u043F\u043E\u043A\u0443\u043F\u043A\u0430" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: clients?.map((client) => (_jsxs(Table.Tr, { children: [_jsx(Table.Td, { children: _jsx(Checkbox, { checked: selectedIds.has(client.id), onChange: (e) => {
                                                    const newSelected = new Set(selectedIds);
                                                    if (e.currentTarget.checked) {
                                                        newSelected.add(client.id);
                                                    }
                                                    else {
                                                        newSelected.delete(client.id);
                                                    }
                                                    setSelectedIds(newSelected);
                                                } }) }), _jsxs(Table.Td, { children: ["#", client.id] }), _jsx(Table.Td, { children: client.fullName }), _jsx(Table.Td, { children: client.phone || '-' }), _jsx(Table.Td, { children: client.email || '-' }), _jsx(Table.Td, { children: client.addressFull || '-' }), _jsx(Table.Td, { children: _jsx(Badge, { color: client.clientType === ClientType.INDIVIDUAL ? 'blue' : 'green', variant: "light", children: client.clientType === ClientType.INDIVIDUAL
                                                    ? 'Физ. лицо'
                                                    : 'Юр. лицо' }) }), _jsx(Table.Td, { children: client.firstPurchaseDate
                                                ? formatDate(client.firstPurchaseDate)
                                                : '-' }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                setSelectedClient(client);
                                                                setViewModalOpened(true);
                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: () => handleOpenEdit(client.id), children: _jsx(IconEdit, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => deleteMutation.mutate(client.id), children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, client.id))) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        setEditingClient(null);
                        form.reset();
                    }, title: editingClient ? 'Редактировать клиента' : 'Создать клиента', centered: true, size: "lg", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "\u0424\u0418\u041E", required: true, ...form.getInputProps('fullName') }), _jsx(TextInput, { label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", ...form.getInputProps('phone') }), _jsx(TextInput, { label: "Email", type: "email", ...form.getInputProps('email') }), _jsx(TextInput, { label: "\u0410\u0434\u0440\u0435\u0441", ...form.getInputProps('addressFull') }), _jsx(Select, { label: "\u0422\u0438\u043F \u043A\u043B\u0438\u0435\u043D\u0442\u0430", data: [
                                        { value: ClientType.INDIVIDUAL, label: 'Физ. лицо' },
                                        { value: ClientType.LEGAL_ENTITY, label: 'Юр. лицо' },
                                    ], ...form.getInputProps('clientType') }), form.values.clientType === ClientType.LEGAL_ENTITY && (_jsxs(_Fragment, { children: [_jsx(Divider, { label: "\u0414\u0430\u043D\u043D\u044B\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", labelPosition: "left" }), _jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", placeholder: "\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", ...form.getInputProps('legalEntityName') }), _jsxs(Group, { grow: true, children: [_jsx(TextInput, { label: "\u0418\u041D\u041D", placeholder: "10 \u0438\u043B\u0438 12 \u0446\u0438\u0444\u0440", ...form.getInputProps('inn') }), _jsx(TextInput, { label: "\u041A\u041F\u041F", placeholder: "9 \u0446\u0438\u0444\u0440", ...form.getInputProps('kpp') })] }), _jsx(TextInput, { label: "\u041E\u0413\u0420\u041D", placeholder: "13 \u0438\u043B\u0438 15 \u0446\u0438\u0444\u0440", ...form.getInputProps('ogrn') }), _jsx(Divider, { label: "\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B", labelPosition: "left" }), _jsx(TextInput, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430", placeholder: "\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430", ...form.getInputProps('bankName') }), _jsxs(Group, { grow: true, children: [_jsx(TextInput, { label: "\u0420\u0430\u0441\u0447\u0435\u0442\u043D\u044B\u0439 \u0441\u0447\u0435\u0442", placeholder: "20 \u0446\u0438\u0444\u0440", ...form.getInputProps('bankAccount') }), _jsx(TextInput, { label: "\u041A\u043E\u0440\u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0441\u0447\u0435\u0442", placeholder: "20 \u0446\u0438\u0444\u0440", ...form.getInputProps('correspondentAccount') })] }), _jsx(TextInput, { label: "\u0411\u0418\u041A", placeholder: "9 \u0446\u0438\u0444\u0440", ...form.getInputProps('bik') })] })), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                setEditingClient(null);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending || updateMutation.isPending, children: editingClient ? 'Сохранить' : 'Создать' })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setSelectedClient(null);
                    }, title: `Клиент #${selectedClient?.id}`, centered: true, size: "xl", children: selectedClient && (_jsxs(Stack, { gap: "md", children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0424\u0418\u041E:" }), _jsx(Text, { children: selectedClient.fullName })] }), selectedClient.phone && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D:" }), _jsx(Text, { children: selectedClient.phone })] })), selectedClient.email && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "Email:" }), _jsx(Text, { children: selectedClient.email })] })), selectedClient.addressFull && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0410\u0434\u0440\u0435\u0441:" }), _jsx(Text, { children: selectedClient.addressFull })] })), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0422\u0438\u043F \u043A\u043B\u0438\u0435\u043D\u0442\u0430:" }), _jsx(Badge, { color: selectedClient.clientType === ClientType.INDIVIDUAL ? 'blue' : 'green', variant: "light", children: selectedClient.clientType === ClientType.INDIVIDUAL
                                            ? 'Физ. лицо'
                                            : 'Юр. лицо' })] }), selectedClient.firstPurchaseDate && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041F\u0435\u0440\u0432\u0430\u044F \u043F\u043E\u043A\u0443\u043F\u043A\u0430:" }), _jsx(Text, { children: formatDate(selectedClient.firstPurchaseDate) })] })), selectedClient.clientType === ClientType.LEGAL_ENTITY && (_jsxs(_Fragment, { children: [_jsx(Divider, { label: "\u0414\u0430\u043D\u043D\u044B\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430", labelPosition: "left" }), selectedClient.legalEntityName && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043B\u0438\u0446\u0430:" }), _jsx(Text, { children: selectedClient.legalEntityName })] })), selectedClient.inn && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0418\u041D\u041D:" }), _jsx(Text, { children: selectedClient.inn })] })), selectedClient.kpp && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041A\u041F\u041F:" }), _jsx(Text, { children: selectedClient.kpp })] })), selectedClient.ogrn && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041E\u0413\u0420\u041D:" }), _jsx(Text, { children: selectedClient.ogrn })] })), (selectedClient.bankName ||
                                        selectedClient.bankAccount ||
                                        selectedClient.correspondentAccount ||
                                        selectedClient.bik) && (_jsxs(_Fragment, { children: [_jsx(Divider, { label: "\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B", labelPosition: "left" }), selectedClient.bankName && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0431\u0430\u043D\u043A\u0430:" }), _jsx(Text, { children: selectedClient.bankName })] })), selectedClient.bankAccount && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0420\u0430\u0441\u0447\u0435\u0442\u043D\u044B\u0439 \u0441\u0447\u0435\u0442:" }), _jsx(Text, { children: selectedClient.bankAccount })] })), selectedClient.correspondentAccount && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u041A\u043E\u0440\u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0441\u0447\u0435\u0442:" }), _jsx(Text, { children: selectedClient.correspondentAccount })] })), selectedClient.bik && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0411\u0418\u041A:" }), _jsx(Text, { children: selectedClient.bik })] }))] }))] }))] })) }), _jsx(MantineModal, { opened: bulkDeleteModalOpened, onClose: () => setBulkDeleteModalOpened(false), title: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F", centered: true, children: _jsxs(Stack, { children: [_jsxs(Text, { children: ["\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C ", selectedIds.size, " \u043A\u043B\u0438\u0435\u043D\u0442", selectedIds.size > 1 && selectedIds.size < 5 ? 'ов' : selectedIds.size >= 5 ? 'ов' : '', "?"] }), _jsx(Text, { size: "sm", c: "dimmed", children: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C. \u041A\u043B\u0438\u0435\u043D\u0442\u044B \u0441 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u0434\u0430\u0436\u0430\u043C\u0438 \u0438\u043B\u0438 \u0432\u044B\u043A\u0443\u043F\u0430\u043C\u0438 \u043D\u0435 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B." }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => setBulkDeleteModalOpened(false), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { color: "red", loading: bulkDeleteMutation.isPending, onClick: () => {
                                            bulkDeleteMutation.mutate(Array.from(selectedIds));
                                        }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })] }) }), _jsx(MantineModal, { opened: importModalOpened, onClose: () => {
                        setImportModalOpened(false);
                        setImportFile(null);
                    }, title: "\u0418\u043C\u043F\u043E\u0440\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 \u0438\u0437 Excel", centered: true, size: "lg", children: _jsxs(Stack, { children: [importFile && (_jsxs(Alert, { icon: _jsx(IconAlertCircle, { size: 16 }), color: "blue", children: [_jsxs(Text, { size: "sm", children: ["\u0412\u044B\u0431\u0440\u0430\u043D \u0444\u0430\u0439\u043B: ", _jsx("strong", { children: importFile.name })] }), _jsxs(Text, { size: "xs", c: "dimmed", mt: "xs", children: ["\u0420\u0430\u0437\u043C\u0435\u0440: ", (importFile.size / 1024).toFixed(2), " KB"] })] })), _jsxs(Alert, { icon: _jsx(IconAlertCircle, { size: 16 }), color: "yellow", children: [_jsx(Text, { size: "sm", fw: 600, mb: "xs", children: "\u0424\u043E\u0440\u043C\u0430\u0442 \u0444\u0430\u0439\u043B\u0430 Excel:" }), _jsxs(Text, { size: "xs", children: ["\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438: ", _jsx("strong", { children: "\u0424\u0418\u041E" }), " (\u0438\u043B\u0438 \"\u0424\u0418\u041E \u043A\u043B\u0438\u0435\u043D\u0442\u0430\", \"\u0418\u043C\u044F\")"] }), _jsx(Text, { size: "xs", mt: "xs", children: "\u041E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438: \u0422\u0435\u043B\u0435\u0444\u043E\u043D, Email, \u0410\u0434\u0440\u0435\u0441, \u0422\u0438\u043F \u043A\u043B\u0438\u0435\u043D\u0442\u0430, \u0418\u041D\u041D, \u041A\u041F\u041F, \u041E\u0413\u0420\u041D, \u0411\u0430\u043D\u043A, \u0420\u0430\u0441\u0447\u0435\u0442\u043D\u044B\u0439 \u0441\u0447\u0435\u0442, \u041A\u043E\u0440\u0440\u0435\u0441\u043F\u043E\u043D\u0434\u0435\u043D\u0442\u0441\u043A\u0438\u0439 \u0441\u0447\u0435\u0442, \u0411\u0418\u041A" })] }), importMutation.data && importMutation.data.failed.length > 0 && (_jsxs(Alert, { icon: _jsx(IconAlertCircle, { size: 16 }), color: "red", children: [_jsxs(Text, { size: "sm", fw: 600, mb: "xs", children: ["\u041E\u0448\u0438\u0431\u043A\u0438 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 (", importMutation.data.failed.length, "):"] }), _jsxs(Stack, { gap: "xs", children: [importMutation.data.failed.slice(0, 10).map((item, idx) => (_jsxs(Text, { size: "xs", children: ["\u0421\u0442\u0440\u043E\u043A\u0430 ", item.row, ": ", item.error] }, idx))), importMutation.data.failed.length > 10 && (_jsxs(Text, { size: "xs", c: "dimmed", children: ["... \u0438 \u0435\u0449\u0435 ", importMutation.data.failed.length - 10, " \u043E\u0448\u0438\u0431\u043E\u043A"] }))] })] })), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                            setImportModalOpened(false);
                                            setImportFile(null);
                                        }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { leftSection: _jsx(IconUpload, { size: 16 }), loading: importMutation.isPending, disabled: !importFile, onClick: () => {
                                            if (importFile) {
                                                importMutation.mutate(importFile);
                                            }
                                        }, children: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] }) })] }) }));
}
