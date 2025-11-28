import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Paper, TextInput, PasswordInput, Button, Title, Text, Stack, } from '@mantine/core';
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
            password: (value) => value.length < 6 ? 'Пароль должен содержать не менее 6 символов' : null,
        },
    });
    const handleSubmit = async (values) => {
        try {
            await login(values.email, values.password);
            navigate('/');
        }
        catch (error) {
            form.setFieldError('password', 'Неверный email или пароль');
        }
    };
    return (_jsxs(Container, { size: 420, my: 40, children: [_jsx(Title, { ta: "center", fw: 900, c: "greenCycle.6", children: "GreenCycle" }), _jsx(Text, { c: "dimmed", size: "sm", ta: "center", mt: 5, children: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0435\u043D\u0438\u044F" }), _jsx(Paper, { withBorder: true, shadow: "md", p: 30, mt: 30, radius: "md", children: _jsx("form", { onSubmit: form.onSubmit(handleSubmit), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "Email", placeholder: "your@email.com", required: true, ...form.getInputProps('email') }), _jsx(PasswordInput, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", placeholder: "\u0412\u0430\u0448 \u043F\u0430\u0440\u043E\u043B\u044C", required: true, ...form.getInputProps('password') }), _jsx(Button, { type: "submit", fullWidth: true, mt: "xl", loading: isLoading, color: "greenCycle", children: "\u0412\u043E\u0439\u0442\u0438" })] }) }) })] }));
}
