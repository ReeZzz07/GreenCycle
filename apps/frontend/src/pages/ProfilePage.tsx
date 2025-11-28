import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Button,
  PasswordInput,
  Avatar,
  Badge,
  SimpleGrid,
  Switch,
  Divider,
  TextInput,
} from '@mantine/core';
import { IconUser, IconLock, IconMail, IconBell } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  usersService,
  NotificationSettings,
  UpdateNotificationSettingsDto,
} from '../services/users.service';

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
    mutationFn: (dto: { fullName?: string; email?: string }) =>
      usersService.updateCurrentUser(dto),
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
    onError: (error: any) => {
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
          } else {
            errorMessage = data.error.message;
          }
        } else if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else {
            errorMessage = data.message;
          }
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleProfileSubmit = (values: { fullName: string; email: string }) => {
    const dto: { fullName?: string; email?: string } = {};
    
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
      currentPassword: (value) =>
        value.length > 0 ? null : 'Введите текущий пароль',
      newPassword: (value) =>
        value.length >= 6 ? null : 'Пароль должен содержать не менее 6 символов',
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : 'Пароли не совпадают',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) =>
      usersService.changePassword(dto),
    onSuccess: () => {
      notifications.show({
        title: 'Успешно',
        message: 'Пароль успешно изменен',
        color: 'green',
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка при смене пароля';
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handlePasswordChange = (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  // Форма для настроек уведомлений
  const notificationForm = useForm<UpdateNotificationSettingsDto>({
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
    mutationFn: (dto: UpdateNotificationSettingsDto) =>
      usersService.updateNotificationSettings(dto),
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
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Ошибка при обновлении настроек';
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleNotificationSettingsSubmit = (values: UpdateNotificationSettingsDto) => {
    updateNotificationSettingsMutation.mutate(values);
  };

  if (!user) {
    return <LoadingSpinner fullHeight />;
  }

  const getInitials = () => {
    return user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container size="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Профиль
          </Title>
          <Text c="dimmed">Управление профилем и настройками</Text>
        </div>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* Редактирование профиля */}
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Title order={3}>Личная информация</Title>
              <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
                <Stack>
                  <Group>
                    <Avatar size="lg" color="greenCycle" radius="xl">
                      {getInitials()}
                    </Avatar>
                    <div>
                      <Text fw={700} size="lg">
                        {user.fullName}
                      </Text>
                      <Text c="dimmed" size="sm">
                        {user.email}
                      </Text>
                      <Badge color="greenCycle" variant="light" mt="xs">
                        {user.role.name === 'super_admin'
                          ? 'Супер-администратор'
                          : user.role.name === 'admin'
                            ? 'Администратор'
                            : user.role.name === 'manager'
                              ? 'Менеджер'
                              : user.role.name === 'accountant'
                                ? 'Бухгалтер'
                                : user.role.name === 'logistic'
                                  ? 'Логист'
                                  : user.role.name}
                      </Badge>
                    </div>
                  </Group>

                  <Divider />

                  <TextInput
                    label="ФИО"
                    required
                    leftSection={<IconUser size={16} />}
                    {...profileForm.getInputProps('fullName')}
                  />

                  <TextInput
                    label="Email"
                    required
                    type="email"
                    leftSection={<IconMail size={16} />}
                    {...profileForm.getInputProps('email')}
                  />

                  <Group>
                    <IconLock size={20} />
                    <div>
                      <Text size="xs" c="dimmed">
                        Роль
                      </Text>
                      <Text fw={500}>
                        {user.role.name === 'super_admin'
                          ? 'Супер-администратор'
                          : user.role.name === 'admin'
                            ? 'Администратор'
                            : user.role.name === 'manager'
                              ? 'Менеджер'
                              : user.role.name === 'accountant'
                                ? 'Бухгалтер'
                                : user.role.name === 'logistic'
                                  ? 'Логист'
                                  : user.role.name}
                      </Text>
                    </div>
                  </Group>

                  <Group justify="flex-end" mt="md">
                    <Button
                      variant="subtle"
                      onClick={() => {
                        if (user) {
                          profileForm.setValues({
                            fullName: user.fullName,
                            email: user.email,
                          });
                          profileForm.resetDirty();
                        }
                      }}
                      disabled={!profileForm.isDirty()}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      loading={updateProfileMutation.isPending}
                      disabled={!profileForm.isDirty()}
                    >
                      Сохранить изменения
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Paper>

          {/* Смена пароля */}
          <Paper withBorder p="md" radius="md">
            <Stack gap="md">
              <Title order={3}>Смена пароля</Title>
              <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
                <Stack>
                  <PasswordInput
                    label="Текущий пароль"
                    required
                    {...passwordForm.getInputProps('currentPassword')}
                  />
                  <PasswordInput
                    label="Новый пароль"
                    required
                    {...passwordForm.getInputProps('newPassword')}
                  />
                  <PasswordInput
                    label="Подтверждение пароля"
                    required
                    {...passwordForm.getInputProps('confirmPassword')}
                  />
                  <Group justify="flex-end" mt="md">
                    <Button
                      variant="subtle"
                      onClick={() => passwordForm.reset()}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      loading={changePasswordMutation.isPending}
                    >
                      Изменить пароль
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Настройки уведомлений */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Group>
              <IconBell size={24} />
              <Title order={3}>Настройки уведомлений</Title>
            </Group>

            {isLoadingSettings ? (
              <LoadingSpinner />
            ) : (
              <form
                onSubmit={notificationForm.onSubmit(handleNotificationSettingsSubmit)}
              >
                <Stack gap="md">
                  <Divider label="Email уведомления" labelPosition="left" />
                  <Switch
                    label="Включить email уведомления"
                    description="Получать уведомления на email"
                    {...notificationForm.getInputProps('emailEnabled', {
                      type: 'checkbox',
                    })}
                  />

                  <Divider label="Уведомления о выкупах" labelPosition="left" />
                  <Switch
                    label="Включить уведомления о выкупах"
                    description="Получать напоминания о предстоящих выкупах"
                    {...notificationForm.getInputProps('buybackRemindersEnabled', {
                      type: 'checkbox',
                    })}
                  />

                  {notificationForm.values.buybackRemindersEnabled && (
                    <Stack gap="sm" pl="md">
                      <Switch
                        label="Напоминание за 60 дней"
                        {...notificationForm.getInputProps('buybackReminder60Days', {
                          type: 'checkbox',
                        })}
                      />
                      <Switch
                        label="Напоминание за 30 дней"
                        {...notificationForm.getInputProps('buybackReminder30Days', {
                          type: 'checkbox',
                        })}
                      />
                      <Switch
                        label="Напоминание за 7 дней"
                        {...notificationForm.getInputProps('buybackReminder7Days', {
                          type: 'checkbox',
                        })}
                      />
                    </Stack>
                  )}

                  <Divider label="Другие уведомления" labelPosition="left" />
                  <Switch
                    label="Уведомления о новых продажах"
                    description="Получать уведомления при создании новых продаж"
                    {...notificationForm.getInputProps('salesNotificationsEnabled', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label="Уведомления о новых поставках"
                    description="Получать уведомления при создании новых поставок"
                    {...notificationForm.getInputProps('shipmentNotificationsEnabled', {
                      type: 'checkbox',
                    })}
                  />
                  <Switch
                    label="Уведомления о финансовых операциях"
                    description="Получать уведомления о финансовых транзакциях"
                    {...notificationForm.getInputProps('financeNotificationsEnabled', {
                      type: 'checkbox',
                    })}
                  />

                  <Group justify="flex-end" mt="md">
                    <Button
                      variant="subtle"
                      onClick={() => {
                        if (notificationSettings) {
                          notificationForm.setValues({
                            emailEnabled: notificationSettings.emailEnabled,
                            buybackRemindersEnabled:
                              notificationSettings.buybackRemindersEnabled,
                            buybackReminder60Days: notificationSettings.buybackReminder60Days,
                            buybackReminder30Days: notificationSettings.buybackReminder30Days,
                            buybackReminder7Days: notificationSettings.buybackReminder7Days,
                            salesNotificationsEnabled:
                              notificationSettings.salesNotificationsEnabled,
                            shipmentNotificationsEnabled:
                              notificationSettings.shipmentNotificationsEnabled,
                            financeNotificationsEnabled:
                              notificationSettings.financeNotificationsEnabled,
                          });
                        }
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      loading={updateNotificationSettingsMutation.isPending}
                    >
                      Сохранить настройки
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
