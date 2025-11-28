import { jsx as _jsx } from "react/jsx-runtime";
import { Modal as MantineModal } from '@mantine/core';
export function Modal({ opened, onClose, title, children, ...props }) {
    return (_jsx(MantineModal, { opened: opened, onClose: onClose, title: title, centered: true, ...props, children: children }));
}
