import { apiClient } from '../config/api';
import {
  Account,
  Transaction,
  PartnerWithdrawal,
  OtherExpense,
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransactionDto,
  CreatePartnerWithdrawalDto,
  CreateOtherExpenseDto,
  UpdateOtherExpenseDto,
} from '../types/finance';

interface AccountsResponse {
  data: Account[];
}

interface AccountResponse {
  data: Account;
}

interface TransactionsResponse {
  data: Transaction[];
}

interface TransactionResponse {
  data: Transaction;
}

interface PartnerWithdrawalsResponse {
  data: PartnerWithdrawal[];
}

interface PartnerWithdrawalResponse {
  data: PartnerWithdrawal;
}

interface OtherExpensesResponse {
  data: OtherExpense[];
}

interface OtherExpenseResponse {
  data: OtherExpense;
}

interface BalanceResponse {
  data: { balance: string };
}

export const financeService = {
  // Accounts
  async getAllAccounts(): Promise<Account[]> {
    const response = await apiClient.get<AccountsResponse>('/finance/accounts');
    return response.data.data;
  },

  async getAccountById(id: number): Promise<Account> {
    const response = await apiClient.get<AccountResponse>(`/finance/accounts/${id}`);
    return response.data.data;
  },

  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const response = await apiClient.post<AccountResponse>('/finance/accounts', dto);
    return response.data.data;
  },

  async updateAccount(id: number, dto: UpdateAccountDto): Promise<Account> {
    const response = await apiClient.patch<AccountResponse>(
      `/finance/accounts/${id}`,
      dto,
    );
    return response.data.data;
  },

  async deleteAccount(id: number): Promise<void> {
    await apiClient.delete(`/finance/accounts/${id}`);
  },

  async recalculateBalance(id: number): Promise<string> {
    const response = await apiClient.post<BalanceResponse>(
      `/finance/accounts/${id}/recalculate`,
    );
    return response.data.data.balance;
  },

  // Transactions
  async getAllTransactions(accountId?: number): Promise<Transaction[]> {
    const params = accountId ? { accountId } : {};
    const response = await apiClient.get<TransactionsResponse>('/finance/transactions', {
      params,
    });
    return response.data.data;
  },

  async getTransactionById(id: number): Promise<Transaction> {
    const response = await apiClient.get<TransactionResponse>(
      `/finance/transactions/${id}`,
    );
    return response.data.data;
  },

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    const response = await apiClient.post<TransactionResponse>(
      '/finance/transactions',
      dto,
    );
    return response.data.data;
  },

  async deleteTransaction(id: number): Promise<any> {
    const response = await apiClient.delete(`/finance/transactions/${id}`);
    return response.data;
  },

  async updateTransactionStatus(id: number, isCancelled: boolean): Promise<Transaction> {
    const response = await apiClient.patch<TransactionResponse>(
      `/finance/transactions/${id}/status`,
      { isCancelled },
    );
    return response.data.data;
  },

  // Partner Withdrawals
  async getAllPartnerWithdrawals(): Promise<PartnerWithdrawal[]> {
    const response = await apiClient.get<PartnerWithdrawalsResponse>(
      '/finance/partner-withdrawals',
    );
    return response.data.data;
  },

  async getPartnerWithdrawalById(id: number): Promise<PartnerWithdrawal> {
    const response = await apiClient.get<PartnerWithdrawalResponse>(
      `/finance/partner-withdrawals/${id}`,
    );
    return response.data.data;
  },

  async createPartnerWithdrawal(
    dto: CreatePartnerWithdrawalDto,
  ): Promise<PartnerWithdrawal> {
    const response = await apiClient.post<PartnerWithdrawalResponse>(
      '/finance/partner-withdrawals',
      dto,
    );
    return response.data.data;
  },

  async deletePartnerWithdrawal(id: number): Promise<void> {
    await apiClient.delete(`/finance/partner-withdrawals/${id}`);
  },

  // Other Expenses
  async getAllOtherExpenses(accountId?: number): Promise<OtherExpense[]> {
    const params = accountId ? { accountId } : {};
    const response = await apiClient.get<OtherExpensesResponse>('/finance/other-expenses', {
      params,
    });
    return response.data.data;
  },

  async getOtherExpenseById(id: number): Promise<OtherExpense> {
    const response = await apiClient.get<OtherExpenseResponse>(
      `/finance/other-expenses/${id}`,
    );
    return response.data.data;
  },

  async createOtherExpense(dto: CreateOtherExpenseDto): Promise<OtherExpense> {
    const response = await apiClient.post<OtherExpenseResponse>(
      '/finance/other-expenses',
      dto,
    );
    return response.data.data;
  },

  async updateOtherExpense(
    id: number,
    dto: UpdateOtherExpenseDto,
  ): Promise<OtherExpense> {
    const response = await apiClient.patch<OtherExpenseResponse>(
      `/finance/other-expenses/${id}`,
      dto,
    );
    return response.data.data;
  },

  async deleteOtherExpense(id: number): Promise<void> {
    await apiClient.delete(`/finance/other-expenses/${id}`);
  },
};
