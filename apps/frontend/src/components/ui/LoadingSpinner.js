import { jsx as _jsx } from "react/jsx-runtime";
import { Loader, Center } from '@mantine/core';
export function LoadingSpinner({ size = 'lg', fullHeight = false, }) {
    const content = _jsx(Loader, { size: size, color: "greenCycle" });
    if (fullHeight) {
        return (_jsx(Center, { h: "100vh", children: content }));
    }
    return _jsx(Center, { py: "xl", children: content });
}
