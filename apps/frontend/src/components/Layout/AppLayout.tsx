import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CSSProperties, ReactNode, useCallback, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const [isCompact, setIsCompact] = useState(false);

  const handleNavigateInSidebar = useCallback(() => {
    if (opened) {
      toggle();
    }
  }, [opened, toggle]);

  const toggleCompact = useCallback(() => {
    setIsCompact((prev) => !prev);
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: isCompact ? 80 : 220,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      style={
        {
          '--app-shell-navbar-width': `${isCompact ? 80 : 220}px`,
        } as CSSProperties
      }
    >
      <AppShell.Header>
        <AppHeader
          opened={opened}
          toggle={toggle}
          isCompact={isCompact}
          toggleCompact={toggleCompact}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <AppSidebar compact={isCompact} onNavigate={handleNavigateInSidebar} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
