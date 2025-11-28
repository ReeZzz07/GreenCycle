import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Table, Group, Button, TextInput, ActionIcon, Tooltip, Badge, Modal as MantineModal, Select, PasswordInput, } from '@mantine/core';
import { IconPlus, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { usersService } from '../services/users.service';
import { formatDate } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { DataViewToggle } from '../components/ui/DataViewToggle';
import { useTableCardLabels } from '../hooks/useTableCardLabels';
import { useAuthContext } from '../contexts/AuthContext';
const ROLE_LABELS = {
    super_admin: 'Супер-администратор',
    admin: 'Администратор',
    manager: 'Менеджер',
    accountant: 'Бухгалтер',
    logistic: 'Логист',
};
export function UsersPage() {
    const { user: currentUser } = useAuthContext();
    const isAdmin = currentUser?.role.name === 'admin' || currentUser?.role.name === 'super_admin';
    const [opened, setOpened] = useState(false);
    const [viewModalOpened, setViewModalOpened] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useLocalStorage({
        key: 'users-view-mode',
        defaultValue: 'table',
    });
    const queryClient = useQueryClient();
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersService.getAll(),
        enabled: isAdmin, // Только админы могут видеть список пользователей
    });
    const filteredUsers = users?.filter((user) => user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        ROLE_LABELS[user.role.name]?.toLowerCase().includes(search.toLowerCase()));
    const tableRef = useTableCardLabels(viewMode, [filteredUsers]);
    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            fullName: '',
            roleName: 'manager',
        },
        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Некорректный email'),
            password: (value, values) => {
                if (!editingUser && !value)
                    return 'Пароль обязателен';
                if (value && value.length < 6)
                    return 'Пароль должен содержать минимум 6 символов';
                return null;
            },
            fullName: (value) => (value.trim().length > 0 ? null : 'Укажите ФИО'),
        },
    });
    const createMutation = useMutation({
        mutationFn: (dto) => usersService.create(dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Пользователь создан',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setOpened(false);
            form.reset();
        },
        onError: (error) => {
            let errorMessage = 'Не удалось создать пользователя';
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
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }) => usersService.update(id, dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Пользователь обновлён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setOpened(false);
            setEditingUser(null);
            form.reset();
        },
        onError: (error) => {
            let errorMessage = 'Не удалось обновить пользователя';
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
    const deleteMutation = useMutation({
        mutationFn: (id) => usersService.delete(id),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Пользователь удалён',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            let errorMessage = 'Не удалось удалить пользователя';
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
    const handleOpenCreate = () => {
        setEditingUser(null);
        form.reset();
        setOpened(true);
    };
    const handleOpenEdit = async (id) => {
        const user = await usersService.getById(id);
        form.setValues({
            email: user.email,
            password: '', // Пароль не заполняем при редактировании
            fullName: user.fullName,
            roleName: user.role.name,
        });
        setEditingUser(id);
        setOpened(true);
    };
    const handleSubmit = (values) => {
        if (editingUser) {
            const updateDto = {
                email: values.email,
                fullName: values.fullName,
                roleName: values.roleName,
            };
            // Пароль добавляем только если он указан
            if (values.password && values.password.length > 0) {
                updateDto.password = values.password;
            }
            updateMutation.mutate({ id: editingUser, dto: updateDto });
        }
        else {
            createMutation.mutate(values);
        }
    };
    if (!isAdmin) {
        return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsx(Title, { order: 1, children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438" }), _jsx(Text, { c: "dimmed", children: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u044D\u0442\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435" })] }) }));
    }
    if (isLoading) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438" }), _jsx(Text, { c: "dimmed", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u044B" })] }), _jsx(Button, { leftSection: _jsx(IconPlus, { size: 16 }), onClick: handleOpenCreate, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" })] }), _jsx(TextInput, { placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0424\u0418\u041E, email, \u0440\u043E\u043B\u0438...", value: search, onChange: (e) => setSearch(e.currentTarget.value), style: { maxWidth: 400 } }), _jsx(Group, { justify: "flex-end", children: _jsx(DataViewToggle, { value: viewMode, onChange: setViewMode }) }), _jsx(Paper, { withBorder: true, mt: "sm", children: _jsxs(Table, { ref: tableRef, className: "gc-data-table", "data-view": viewMode, striped: true, highlightOnHover: true, children: [_jsx(Table.Thead, { children: _jsxs(Table.Tr, { children: [_jsx(Table.Th, { children: "ID" }), _jsx(Table.Th, { children: "\u0424\u0418\u041E" }), _jsx(Table.Th, { children: "Email" }), _jsx(Table.Th, { children: "\u0420\u043E\u043B\u044C" }), _jsx(Table.Th, { children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F" }), _jsx(Table.Th, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(Table.Tbody, { children: filteredUsers && filteredUsers.length > 0 ? (filteredUsers.map((user) => (_jsxs(Table.Tr, { children: [_jsxs(Table.Td, { children: ["#", user.id] }), _jsx(Table.Td, { children: user.fullName }), _jsx(Table.Td, { children: user.email }), _jsx(Table.Td, { children: _jsx(Badge, { color: user.role.name === 'super_admin'
                                                    ? 'red'
                                                    : user.role.name === 'admin'
                                                        ? 'orange'
                                                        : 'blue', variant: "light", children: ROLE_LABELS[user.role.name] || user.role.name }) }), _jsx(Table.Td, { children: formatDate(user.createdAt) }), _jsx(Table.Td, { children: _jsxs(Group, { gap: "xs", children: [_jsx(Tooltip, { label: "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", children: _jsx(ActionIcon, { variant: "subtle", color: "greenCycle", onClick: () => {
                                                                setSelectedUser(user);
                                                                setViewModalOpened(true);
                                                            }, children: _jsx(IconEye, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "blue", onClick: () => handleOpenEdit(user.id), children: _jsx(IconEdit, { size: 16 }) }) }), _jsx(Tooltip, { label: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(ActionIcon, { variant: "subtle", color: "red", onClick: () => {
                                                                if (window.confirm(`Вы уверены, что хотите удалить пользователя "${user.fullName}"? Это действие нельзя отменить.`)) {
                                                                    deleteMutation.mutate(user.id);
                                                                }
                                                            }, disabled: user.id === currentUser?.id, children: _jsx(IconTrash, { size: 16 }) }) })] }) })] }, user.id)))) : (_jsx(Table.Tr, { children: _jsx(Table.Td, { colSpan: 6, style: { textAlign: 'center' }, children: _jsx(Text, { c: "dimmed", py: "md", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }) }) })) })] }) }), _jsx(MantineModal, { opened: opened, onClose: () => {
                        setOpened(false);
                        setEditingUser(null);
                        form.reset();
                    }, title: editingUser ? 'Редактировать пользователя' : 'Создать пользователя', centered: true, size: "lg", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "Email", required: true, type: "email", ...form.getInputProps('email') }), _jsx(PasswordInput, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", required: !editingUser, description: editingUser ? 'Оставьте пустым, если не хотите менять пароль' : '', ...form.getInputProps('password') }), _jsx(TextInput, { label: "\u0424\u0418\u041E", required: true, ...form.getInputProps('fullName') }), _jsx(Select, { label: "\u0420\u043E\u043B\u044C", required: true, data: [
                                        { value: 'super_admin', label: 'Супер-администратор' },
                                        { value: 'admin', label: 'Администратор' },
                                        { value: 'manager', label: 'Менеджер' },
                                        { value: 'accountant', label: 'Бухгалтер' },
                                        { value: 'logistic', label: 'Логист' },
                                    ], ...form.getInputProps('roleName') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                setOpened(false);
                                                setEditingUser(null);
                                                form.reset();
                                            }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: createMutation.isPending || updateMutation.isPending, children: editingUser ? 'Сохранить' : 'Создать' })] })] }) }) }), _jsx(MantineModal, { opened: viewModalOpened, onClose: () => {
                        setViewModalOpened(false);
                        setSelectedUser(null);
                    }, title: `Пользователь #${selectedUser?.id || ''}`, centered: true, size: "lg", children: selectedUser && (_jsxs(Stack, { gap: "md", children: [_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "ID:" }), _jsxs(Text, { children: ["#", selectedUser.id] })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0424\u0418\u041E:" }), _jsx(Text, { children: selectedUser.fullName })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "Email:" }), _jsx(Text, { children: selectedUser.email })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0420\u043E\u043B\u044C:" }), _jsx(Badge, { color: selectedUser.role.name === 'super_admin'
                                            ? 'red'
                                            : selectedUser.role.name === 'admin'
                                                ? 'orange'
                                                : 'blue', variant: "light", children: ROLE_LABELS[selectedUser.role.name] || selectedUser.role.name })] }), _jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F:" }), _jsx(Text, { children: formatDate(selectedUser.createdAt) })] }), selectedUser.updatedAt !== selectedUser.createdAt && (_jsxs(Group, { children: [_jsx(Text, { fw: 600, children: "\u0414\u0430\u0442\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F:" }), _jsx(Text, { children: formatDate(selectedUser.updatedAt) })] }))] })) })] }) }));
}
