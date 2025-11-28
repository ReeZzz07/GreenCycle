import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataViewToggle } from '../DataViewToggle';
import { MantineProvider } from '@mantine/core';
describe('DataViewToggle', () => {
    it('calls onChange when switching view modes', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(_jsx(MantineProvider, { children: _jsx(DataViewToggle, { value: "table", onChange: handleChange }) }));
        const cardsButton = screen.getByLabelText(/Просмотр плитками/i);
        await user.click(cardsButton);
        expect(handleChange).toHaveBeenCalledWith('cards');
        const tableButton = screen.getByLabelText(/Просмотр таблицей/i);
        await user.click(tableButton);
        expect(handleChange).toHaveBeenCalledWith('table');
        expect(handleChange).toHaveBeenCalledTimes(2);
    });
});
