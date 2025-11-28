import { Modal as MantineModal, ModalProps as MantineModalProps } from '@mantine/core';

interface ModalProps extends Omit<MantineModalProps, 'opened' | 'onClose'> {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ opened, onClose, title, children, ...props }: ModalProps) {
  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      {...props}
    >
      {children}
    </MantineModal>
  );
}
