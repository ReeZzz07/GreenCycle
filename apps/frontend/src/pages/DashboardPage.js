import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Container, Title, Text, SimpleGrid, Paper, Group, Stack, Loader, Center, } from '@mantine/core';
import { IconCurrencyDollar, IconPackage, IconTrendingUp, IconShoppingCart, IconCheck, } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '../services/finance.service';
import { inventoryService } from '../services/inventory.service';
import { salesService } from '../services/sales.service';
import { shipmentsService } from '../services/shipments.service';
import { formatCurrency } from '../utils/format';
export function DashboardPage() {
    const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => financeService.getAllAccounts(),
    });
    const { data: inventory, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => inventoryService.getSummary(),
    });
    const { data: sales, isLoading: isLoadingSales } = useQuery({
        queryKey: ['sales'],
        queryFn: () => salesService.getAll(),
    });
    const { data: shipments, isLoading: isLoadingShipments } = useQuery({
        queryKey: ['shipments'],
        queryFn: () => shipmentsService.getAll(),
    });
    const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;
    const totalInventory = inventory?.reduce((sum, item) => sum + item.quantityCurrent, 0) || 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySales = sales?.filter((sale) => {
        const saleDate = new Date(sale.saleDate);
        return (saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear &&
            sale.status === 'completed');
    }) || [];
    const monthlySalesTotal = monthlySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;
    const monthlyShipments = shipments?.filter((shipment) => {
        const shipmentDate = new Date(shipment.arrivalDate);
        return (shipmentDate.getMonth() === currentMonth &&
            shipmentDate.getFullYear() === currentYear);
    }) || [];
    const monthlyShipmentsTotal = monthlyShipments.reduce((sum, shipment) => sum + Number(shipment.totalCost), 0) || 0;
    // Подсчитываем общее количество проданных единиц товара из всех завершенных продаж
    const totalSoldUnits = sales?.reduce((sum, sale) => {
        if (sale.status === 'completed' && sale.items) {
            return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }
        return sum;
    }, 0) || 0;
    const isLoading = isLoadingAccounts || isLoadingInventory || isLoadingSales || isLoadingShipments;
    if (isLoading) {
        return (_jsx(Container, { size: "xl", children: _jsx(Center, { h: "50vh", children: _jsx(Loader, { size: "lg", color: "greenCycle" }) }) }));
    }
    return (_jsx(Container, { size: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsxs("div", { children: [_jsx(Title, { order: 1, mb: "xs", children: "\u0414\u0430\u0448\u0431\u043E\u0440\u0434" }), _jsx(Text, { c: "dimmed", children: "\u041E\u0431\u0437\u043E\u0440 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u043C\u0435\u0442\u0440\u0438\u043A \u0438 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0439" })] }), _jsxs(SimpleGrid, { cols: { base: 1, sm: 2, lg: 5 }, spacing: "md", children: [_jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0411\u0430\u043B\u0430\u043D\u0441" }), _jsx(Text, { fw: 700, size: "xl", children: formatCurrency(totalBalance) })] }), _jsx(IconCurrencyDollar, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u041D\u0430 \u0441\u043A\u043B\u0430\u0434\u0435" }), _jsxs(Text, { fw: 700, size: "xl", children: [totalInventory, " \u0448\u0442"] })] }), _jsx(IconPackage, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 (\u043C\u0435\u0441\u044F\u0446)" }), _jsx(Text, { fw: 700, size: "xl", children: formatCurrency(monthlySalesTotal) })] }), _jsx(IconTrendingUp, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u0417\u0430\u043A\u0443\u043F\u043A\u0438 (\u043C\u0435\u0441\u044F\u0446)" }), _jsx(Text, { fw: 700, size: "xl", children: formatCurrency(monthlyShipmentsTotal) })] }), _jsx(IconShoppingCart, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) }), _jsx(Paper, { withBorder: true, p: "md", radius: "md", children: _jsxs(Group, { justify: "space-between", children: [_jsxs("div", { children: [_jsx(Text, { c: "dimmed", size: "xs", tt: "uppercase", fw: 700, children: "\u041F\u0440\u043E\u0434\u0430\u043D\u043E \u0435\u0434\u0438\u043D\u0438\u0446" }), _jsxs(Text, { fw: 700, size: "xl", children: [totalSoldUnits, " \u0448\u0442"] })] }), _jsx(IconCheck, { size: 32, style: { color: 'var(--mantine-color-greenCycle-6)' } })] }) })] })] }) }));
}
