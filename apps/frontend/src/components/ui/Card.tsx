import { Paper, PaperProps, Title, Text, Stack } from '@mantine/core';
import { ReactNode } from 'react';

interface CardProps extends PaperProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Card({ title, description, children, ...props }: CardProps) {
  return (
    <Paper withBorder p="md" radius="md" {...props}>
      <Stack gap="sm">
        {(title || description) && (
          <div>
            {title && (
              <Title order={4} mb="xs">
                {title}
              </Title>
            )}
            {description && (
              <Text c="dimmed" size="sm">
                {description}
              </Text>
            )}
          </div>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
