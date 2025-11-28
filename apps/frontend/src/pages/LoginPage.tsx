import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthContext();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Некорректный email'),
      password: (value) =>
        value.length < 6 ? 'Пароль должен содержать не менее 6 символов' : null,
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      form.setFieldError('password', 'Неверный email или пароль');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900} c="greenCycle.6">
        GreenCycle
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Войдите в систему для продолжения
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Пароль"
              placeholder="Ваш пароль"
              required
              {...form.getInputProps('password')}
            />
            <Button type="submit" fullWidth mt="xl" loading={isLoading} color="greenCycle">
              Войти
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
