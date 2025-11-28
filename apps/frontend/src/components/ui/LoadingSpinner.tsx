import { Loader, Center } from '@mantine/core';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullHeight?: boolean;
}

export function LoadingSpinner({
  size = 'lg',
  fullHeight = false,
}: LoadingSpinnerProps) {
  const content = <Loader size={size} color="greenCycle" />;

  if (fullHeight) {
    return (
      <Center h="100vh">
        {content}
      </Center>
    );
  }

  return <Center py="xl">{content}</Center>;
}
