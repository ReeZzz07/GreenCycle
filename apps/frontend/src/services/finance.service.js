import { apiClient } from '../config/api';
export const financeService = {
    // Accounts
    async getAllAccounts() {
        const response = await apiClient.get('/finance/accounts');
        return response.data.data;
    },
    async getAccountById(id) {
        const response = await apiClient.get(`/finance/accounts/${id}`);
        return response.data.data;
    },
    async createAccount(dto) {
        const response = await apiClient.post('/finance/accounts', dto);
        return response.data.data;
    },
    async updateAccount(id, dto) {
        const response = await apiClient.patch(`/finance/accounts/${id}`, dto);
        return response.data.data;
    },
    async deleteAccount(id) {
        await apiClient.delete(`/finance/accounts/${id}`);
    },
    async recalculateBalance(id) {
        const response = await apiClient.post(`/finance/accounts/${id}/recalculate`);
        return response.data.data.balance;
    },
    // Transactions
    async getAllTransactions(accountId) {
        const params = accountId ? { accountId } : {};
        const response = await apiClient.get('/finance/transactions', {
            params,
        });
        return response.data.data;
    },
    async getTransactionById(id) {
        const response = await apiClient.get(`/finance/transactions/${id}`);
        return response.data.data;
    },
    async createTransaction(dto) {
        const response = await apiClient.post('/finance/transactions', dto);
        return response.data.data;
    },
    async deleteTransaction(id) {
        const response = await apiClient.delete(`/finance/transactions/${id}`);
        return response.data;
    },
    async updateTransactionStatus(id, isCancelled) {
        const response = await apiClient.patch(`/finance/transactions/${id}/status`, { isCancelled });
        return response.data.data;
    },
    // Partner Withdrawals
    async getAllPartnerWithdrawals() {
        const response = await apiClient.get('/finance/partner-withdrawals');
        return response.data.data;
    },
    async getPartnerWithdrawalById(id) {
        const response = await apiClient.get(`/finance/partner-withdrawals/${id}`);
        return response.data.data;
    },
    async createPartnerWithdrawal(dto) {
        const response = await apiClient.post('/finance/partner-withdrawals', dto);
        return response.data.data;
    },
    async deletePartnerWithdrawal(id) {
        await apiClient.delete(`/finance/partner-withdrawals/${id}`);
    },
    // Other Expenses
    async getAllOtherExpenses(accountId) {
        const params = accountId ? { accountId } : {};
        const response = await apiClient.get('/finance/other-expenses', {
            params,
        });
        return response.data.data;
    },
    async getOtherExpenseById(id) {
        const response = await apiClient.get(`/finance/other-expenses/${id}`);
        return response.data.data;
    },
    async createOtherExpense(dto) {
        const response = await apiClient.post('/finance/other-expenses', dto);
        return response.data.data;
    },
    async updateOtherExpense(id, dto) {
        const response = await apiClient.patch(`/finance/other-expenses/${id}`, dto);
        return response.data.data;
    },
    async deleteOtherExpense(id) {
        await apiClient.delete(`/finance/other-expenses/${id}`);
    },
};
