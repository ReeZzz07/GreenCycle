import { useEffect, useState } from 'react';
import { Alert, Group, Text } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';
import { checkOnlineStatus, addOnlineStatusListener } from '../utils/pwa';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus());

  useEffect(() => {
    const unsubscribe = addOnlineStatusListener(setIsOnline);
    return unsubscribe;
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Alert
      color="orange"
      icon={<IconWifiOff size={16} />}
      title="Нет подключения к интернету"
      styles={{
        root: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: 0,
        },
      }}
    >
      <Group gap="xs">
        <Text size="sm">
          Приложение работает в режиме offline. Некоторые функции могут быть недоступны.
        </Text>
      </Group>
    </Alert>
  );
}

