import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

type Margin = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type BarSeries = {
  key: string;
  name?: string;
  color: string;
  activeFill?: string;
  activeStroke?: string;
};

interface SimpleBarChartProps<T extends Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  bars: BarSeries[];
  height?: number;
  margin?: Margin;
  gridStrokeDasharray?: string;
  showLegend?: boolean;
  yAxisWidth?: number;
  yAxisTickFormatter?: (value: number) => string;
  xAxisTickFormatter?: (value: string) => string;
  tooltipFormatter?: TooltipProps<number | string, string>['formatter'];
  labelFormatter?: TooltipProps<number | string, string>['labelFormatter'];
}

export function SimpleBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  bars,
  height = 300,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  gridStrokeDasharray = '3 3',
  showLegend = true,
  yAxisWidth = 60,
  yAxisTickFormatter,
  xAxisTickFormatter,
  tooltipFormatter,
  labelFormatter,
}: SimpleBarChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray={gridStrokeDasharray} />
        <XAxis
          dataKey={String(xKey)}
          tick={{ fontSize: 12 }}
          tickFormatter={xAxisTickFormatter}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          tickFormatter={yAxisTickFormatter}
        />
        <Tooltip
          formatter={tooltipFormatter}
          labelFormatter={labelFormatter}
          contentStyle={{
            backgroundColor: 'var(--mantine-color-body)',
            border: '1px solid var(--mantine-color-default-border)',
          }}
        />
        {showLegend && <Legend />}
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            name={bar.name ?? bar.key}
            activeBar={
              <Rectangle
                fill={bar.activeFill ?? bar.color}
                stroke={bar.activeStroke ?? bar.color}
              />
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export default SimpleBarChart;

