import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, Stack, Paper, Group, Button, PasswordInput, Avatar, Badge, SimpleGrid, Switch, Divider, TextInput, } from '@mantine/core';
import { IconUser, IconLock, IconMail, IconBell } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { usersService, } from '../services/users.service';
export function ProfilePage() {
    const { user, refreshUser } = useAuthContext();
    const queryClient = useQueryClient();
    // Загрузка настроек уведомлений
    const { data: notificationSettings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: () => usersService.getNotificationSettings(),
    });
    // Форма для редактирования профиля
    const profileForm = useForm({
        initialValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
        },
        validate: {
            fullName: (value) => {
                const trimmed = value?.trim() || '';
                return trimmed.length > 0 ? null : 'Введите ФИО';
            },
            email: (value) => {
                const trimmed = value?.trim() || '';
                if (trimmed.length === 0) {
                    return 'Введите email';
                }
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? null : 'Некорректный email';
            },
        },
    });
    // Обновляем форму при изменении пользователя
    useEffect(() => {
        if (user) {
            profileForm.setValues({
                fullName: user.fullName,
                email: user.email,
            });
            profileForm.resetDirty();
        }
    }, [user]);
    const updateProfileMutation = useMutation({
        mutationFn: (dto) => usersService.updateCurrentUser(dto),
        onSuccess: async (data) => {
            notifications.show({
                title: 'Успешно',
                message: 'Профиль успешно обновлен',
                color: 'green',
            });
            // Обновляем данные пользователя в контексте
            if (refreshUser) {
                await refreshUser();
            }
            profileForm.resetDirty();
        },
        onError: (error) => {
            console.error('Ошибка обновления профиля:', error);
            console.error('Response data:', error?.response?.data);
            console.error('Response status:', error?.response?.status);
            let errorMessage = 'Ошибка при обновлении профиля';
            if (error?.response?.data) {
                const data = error.response.data;
                // Обработка ошибок валидации NestJS
                if (data.error?.message) {
                    if (Array.isArray(data.error.message)) {
                        errorMessage = data.error.message.join(', ');
                    }
                    else {
                        errorMessage = data.error.message;
                    }
                }
                else if (data.message) {
                    if (Array.isArray(data.message)) {
                        errorMessage = data.message.join(', ');
                    }
                    else {
                        errorMessage = data.message;
                    }
                }
                else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }
            else if (error?.message) {
                errorMessage = error.message;
            }
            notifications.show({
                title: 'Ошибка',
                message: errorMessage,
                color: 'red',
            });
        },
    });
    const handleProfileSubmit = (values) => {
        const dto = {};
        const trimmedFullName = values.fullName?.trim() || '';
        const trimmedEmail = values.email?.trim().toLowerCase() || '';
        // Проверяем, что хотя бы одно поле изменилось
        if (trimmedFullName && trimmedFullName !== user?.fullName) {
            dto.fullName = trimmedFullName;
        }
        if (trimmedEmail && trimmedEmail !== user?.email) {
            dto.email = trimmedEmail;
        }
        // Если нет изменений, не отправляем запрос
        if (Object.keys(dto).length === 0) {
            notifications.show({
                title: 'Информация',
                message: 'Нет изменений для сохранения',
                color: 'blue',
            });
            return;
        }
        console.log('Отправка данных на обновление:', dto);
        updateProfileMutation.mutate(dto);
    };
    const passwordForm = useForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            currentPassword: (value) => value.length > 0 ? null : 'Введите текущий пароль',
            newPassword: (value) => value.length >= 6 ? null : 'Пароль должен содержать не менее 6 символов',
            confirmPassword: (value, values) => value === values.newPassword ? null : 'Пароли не совпадают',
        },
    });
    const changePasswordMutation = useMutation({
        mutationFn: (dto) => usersService.changePassword(dto),
        onSuccess: () => {
            notifications.show({
                title: 'Успешно',
                message: 'Пароль успешно изменен',
                color: 'green',
            });
            passwordForm.reset();
        },
        onError: (error) => {
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Ошибка при смене пароля';
            notifications.show({
                title: 'Ошибка',
                message: errorMessage,
                color: 'red',
            });
        },
    });
    const handlePasswordChange = (values) => {
        changePasswordMutation.mutate({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
        });
    };
    // Форма для настроек уведомлений
    const notificationForm = useForm({
        initialValues: {
            emailEnabled: true,
            buybackRemindersEnabled: true,
            buybackReminder60Days: true,
            buybackReminder30Days: true,
            buybackReminder7Days: true,
            salesNotificationsEnabled: true,
            shipmentNotificationsEnabled: true,
            financeNotificationsEnabled: true,
        },
    });
    // Обновляем форму при загрузке настроек
    useEffect(() => {
        if (notificationSettings) {
            notificationForm.setValues({
                emailEnabled: notificationSettings.emailEnabled,
                buybackRemindersEnabled: notificationSettings.buybackRemindersEnabled,
                buybackReminder60Days: notificationSettings.buybackReminder60Days,
                buybackReminder30Days: notificationSettings.buybackReminder30Days,
                buybackReminder7Days: notificationSettings.buybackReminder7Days,
                salesNotificationsEnabled: notificationSettings.salesNotificationsEnabled,
                shipmentNotificationsEnabled: notificationSettings.shipmentNotificationsEnabled,
                financeNotificationsEnabled: notificationSettings.financeNotificationsEnabled,
            });
            notificationForm.resetDirty();
        }
    }, [notificationSettings]);
    const updateNotificationSettingsMutation = useMutation({
        mutationFn: (dto) => usersService.updateNotificationSettings(dto),
        onSuccess: (data) => {
            notifications.show({
                title: 'Успешно',
                message: 'Настройки уведомлений обновлены',
                color: 'green',
            });
            queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
            // Обновляем форму с сохранёнными данными
            notificationForm.setValues({
                emailEnabled: data.emailEnabled,
                buybackRemindersEnabled: data.buybackRemindersEnabled,
                buybackReminder60Days: data.buybackReminder60Days,
                buybackReminder30Days: data.buybackReminder30Days,
                buybackReminder7Days: data.buybackReminder7Days,
                salesNotificationsEnabled: data.salesNotificationsEnabled,
                shipmentNotificationsEnabled: data.shipmentNotificationsEnabled,
                financeNotificationsEnabled: data.financeNotificationsEnabled,
            });
            notificationForm.resetDirty();
        },
        onError: (error) => {
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Ошибка при обновлении настроек';
            notifications.show({
                title: 'Ошибка',
                message: errorMessage,
                color: 'red',
            });
        },
    });
    const handleNotificationSettingsSubmit = (values) => {
        updateNotificationSettingsMutation.mutate(values);
    };
    if (!user) {
        return _jsx(LoadingSpinner, { fullHeight: true });
    }
    const getInitials = () => {
        return user.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" }), _jsx(Text, { c: "dimmed", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u0435\u043C \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u043C\u0438" })] }), _jsxs(SimpleGrid, { cols: { base: 1, lg: 2 }, spacing: "xl", children: [_jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Stack, { gap: "md", children: [_jsx(Title, { order: 3, children: "\u041B\u0438\u0447\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsx("form", { onSubmit: profileForm.onSubmit(handleProfileSubmit), children: _jsxs(Stack, { children: [_jsxs(Group, { children: [_jsx(Avatar, { size: "lg", color: "greenCycle", radius: "xl", children: getInitials() }), _jsxs("div", { children: [_jsx(Text, { fw: 700, size: "lg", children: user.fullName }), _jsx(Text, { c: "dimmed", size: "sm", children: user.email }), _jsx(Badge, { color: "greenCycle", variant: "light", mt: "xs", children: user.role.name === 'super_admin'
                                                                        ? 'Супер-администратор'
                                                                        : user.role.name === 'admin'
                                                                            ? 'Администратор'
                                                                            : user.role.name === 'manager'
                                                                                ? 'Менеджер'
                                                                                : user.role.name === 'accountant'
                                                                                    ? 'Бухгалтер'
                                                                                    : user.role.name === 'logistic'
                                                                                        ? 'Логист'
                                                                                        : user.role.name })] })] }), _jsx(Divider, {}), _jsx(TextInput, { label: "\u0424\u0418\u041E", required: true, leftSection: _jsx(IconUser, { size: 16 }), ...profileForm.getInputProps('fullName') }), _jsx(TextInput, { label: "Email", required: true, type: "email", leftSection: _jsx(IconMail, { size: 16 }), ...profileForm.getInputProps('email') }), _jsxs(Group, { children: [_jsx(IconLock, { size: 20 }), _jsxs("div", { children: [_jsx(Text, { size: "xs", c: "dimmed", children: "\u0420\u043E\u043B\u044C" }), _jsx(Text, { fw: 500, children: user.role.name === 'super_admin'
                                                                        ? 'Супер-администратор'
                                                                        : user.role.name === 'admin'
                                                                            ? 'Администратор'
                                                                            : user.role.name === 'manager'
                                                                                ? 'Менеджер'
                                                                                : user.role.name === 'accountant'
                                                                                    ? 'Бухгалтер'
                                                                                    : user.role.name === 'logistic'
                                                                                        ? 'Логист'
                                                                                        : user.role.name })] })] }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                                if (user) {
                                                                    profileForm.setValues({
                                                                        fullName: user.fullName,
                                                                        email: user.email,
                                                                    });
                                                                    profileForm.resetDirty();
                                                                }
                                                            }, disabled: !profileForm.isDirty(), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: updateProfileMutation.isPending, disabled: !profileForm.isDirty(), children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F" })] })] }) })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Stack, { gap: "md", children: [_jsx(Title, { order: 3, children: "\u0421\u043C\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u044F" }), _jsx("form", { onSubmit: passwordForm.onSubmit(handlePasswordChange), children: _jsxs(Stack, { children: [_jsx(PasswordInput, { label: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C", required: true, ...passwordForm.getInputProps('currentPassword') }), _jsx(PasswordInput, { label: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C", required: true, ...passwordForm.getInputProps('newPassword') }), _jsx(PasswordInput, { label: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F", required: true, ...passwordForm.getInputProps('confirmPassword') }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => passwordForm.reset(), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: changePasswordMutation.isPending, children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C" })] })] }) })] }) })] }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Stack, { gap: "md", children: [_jsxs(Group, { children: [_jsx(IconBell, { size: 24 }), _jsx(Title, { order: 3, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439" })] }), isLoadingSettings ? (_jsx(LoadingSpinner, {})) : (_jsx("form", { onSubmit: notificationForm.onSubmit(handleNotificationSettingsSubmit), children: _jsxs(Stack, { gap: "md", children: [_jsx(Divider, { label: "Email \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", labelPosition: "left" }), _jsx(Switch, { label: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C email \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", description: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043D\u0430 email", ...notificationForm.getInputProps('emailEnabled', {
                                                type: 'checkbox',
                                            }) }), _jsx(Divider, { label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0432\u044B\u043A\u0443\u043F\u0430\u0445", labelPosition: "left" }), _jsx(Switch, { label: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0432\u044B\u043A\u0443\u043F\u0430\u0445", description: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F \u043E \u043F\u0440\u0435\u0434\u0441\u0442\u043E\u044F\u0449\u0438\u0445 \u0432\u044B\u043A\u0443\u043F\u0430\u0445", ...notificationForm.getInputProps('buybackRemindersEnabled', {
                                                type: 'checkbox',
                                            }) }), notificationForm.values.buybackRemindersEnabled && (_jsxs(Stack, { gap: "sm", pl: "md", children: [_jsx(Switch, { label: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u0437\u0430 60 \u0434\u043D\u0435\u0439", ...notificationForm.getInputProps('buybackReminder60Days', {
                                                        type: 'checkbox',
                                                    }) }), _jsx(Switch, { label: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u0437\u0430 30 \u0434\u043D\u0435\u0439", ...notificationForm.getInputProps('buybackReminder30Days', {
                                                        type: 'checkbox',
                                                    }) }), _jsx(Switch, { label: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u0437\u0430 7 \u0434\u043D\u0435\u0439", ...notificationForm.getInputProps('buybackReminder7Days', {
                                                        type: 'checkbox',
                                                    }) })] })), _jsx(Divider, { label: "\u0414\u0440\u0443\u0433\u0438\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", labelPosition: "left" }), _jsx(Switch, { label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u043D\u043E\u0432\u044B\u0445 \u043F\u0440\u043E\u0434\u0430\u0436\u0430\u0445", description: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043D\u043E\u0432\u044B\u0445 \u043F\u0440\u043E\u0434\u0430\u0436", ...notificationForm.getInputProps('salesNotificationsEnabled', {
                                                type: 'checkbox',
                                            }) }), _jsx(Switch, { label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u043D\u043E\u0432\u044B\u0445 \u043F\u043E\u0441\u0442\u0430\u0432\u043A\u0430\u0445", description: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043D\u043E\u0432\u044B\u0445 \u043F\u043E\u0441\u0442\u0430\u0432\u043E\u043A", ...notificationForm.getInputProps('shipmentNotificationsEnabled', {
                                                type: 'checkbox',
                                            }) }), _jsx(Switch, { label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0445 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F\u0445", description: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0445 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F\u0445", ...notificationForm.getInputProps('financeNotificationsEnabled', {
                                                type: 'checkbox',
                                            }) }), _jsxs(Group, { justify: "flex-end", mt: "md", children: [_jsx(Button, { variant: "subtle", onClick: () => {
                                                        if (notificationSettings) {
                                                            notificationForm.setValues({
                                                                emailEnabled: notificationSettings.emailEnabled,
                                                                buybackRemindersEnabled: notificationSettings.buybackRemindersEnabled,
                                                                buybackReminder60Days: notificationSettings.buybackReminder60Days,
                                                                buybackReminder30Days: notificationSettings.buybackReminder30Days,
                                                                buybackReminder7Days: notificationSettings.buybackReminder7Days,
                                                                salesNotificationsEnabled: notificationSettings.salesNotificationsEnabled,
                                                                shipmentNotificationsEnabled: notificationSettings.shipmentNotificationsEnabled,
                                                                financeNotificationsEnabled: notificationSettings.financeNotificationsEnabled,
                                                            });
                                                        }
                                                    }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", loading: updateNotificationSettingsMutation.isPending, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }) }))] }) })] }) }));
}
