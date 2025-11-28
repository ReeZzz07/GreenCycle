import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bar, BarChart, CartesianGrid, Legend, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
export function SimpleBarChart({ data, xKey, bars, height = 300, margin = { top: 20, right: 30, left: 20, bottom: 20 }, gridStrokeDasharray = '3 3', showLegend = true, yAxisWidth = 60, yAxisTickFormatter, xAxisTickFormatter, tooltipFormatter, labelFormatter, }) {
    return (_jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(BarChart, { data: data, margin: margin, children: [_jsx(CartesianGrid, { strokeDasharray: gridStrokeDasharray }), _jsx(XAxis, { dataKey: String(xKey), tick: { fontSize: 12 }, tickFormatter: xAxisTickFormatter }), _jsx(YAxis, { width: yAxisWidth, tick: { fontSize: 12 }, tickFormatter: yAxisTickFormatter }), _jsx(Tooltip, { formatter: tooltipFormatter, labelFormatter: labelFormatter, contentStyle: {
                        backgroundColor: 'var(--mantine-color-body)',
                        border: '1px solid var(--mantine-color-default-border)',
                    } }), showLegend && _jsx(Legend, {}), bars.map((bar) => (_jsx(Bar, { dataKey: bar.key, fill: bar.color, name: bar.name ?? bar.key, activeBar: _jsx(Rectangle, { fill: bar.activeFill ?? bar.color, stroke: bar.activeStroke ?? bar.color }) }, bar.key)))] }) }));
}
export default SimpleBarChart;
