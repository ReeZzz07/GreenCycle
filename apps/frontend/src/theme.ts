import { createTheme, MantineColorsTuple } from '@mantine/core';

const greenCyclePrimary: MantineColorsTuple = [
  '#e8f5e9',
  '#c8e6c9',
  '#a5d6a7',
  '#81c784',
  '#66bb6a',
  '#4caf50',
  '#43a047',
  '#388e3c',
  '#2e7d32',
  '#1b5e20',
];

export const theme = createTheme({
  primaryColor: 'greenCycle',
  colors: {
    greenCycle: greenCyclePrimary,
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  },
  defaultRadius: 'md',
  primaryShade: 6,
});
