export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  OTHER = 'other',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: string;
  transactions?: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  BUYBACK = 'buyback',
  WRITE_OFF = 'write_off',
  PARTNER_WITHDRAWAL = 'partner_withdrawal',
}

export interface Transaction {
  id: number;
  accountId: number;
  account: {
    id: number;
    name: string;
    type: AccountType;
  };
  amount: string;
  type: TransactionType;
  description: string | null;
  linkedEntityId: number | null;
  linkedEntityType: string | null;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string;
  sale?: {
    id: number;
    clientId: number;
    client: {
      id: number;
      fullName: string;
    };
    saleDate: string;
    totalAmount: string;
    status: 'completed' | 'cancelled';
    items: Array<{
      id: number;
      quantity: number;
      salePricePerUnit: string;
      batch: {
        id: number;
        plantType: string;
        sizeCmMin: number;
        sizeCmMax: number;
        potType: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface PartnerWithdrawal {
  id: number;
  userId: number;
  user: {
    id: number;
    fullName: string;
  };
  type: 'cash' | 'goods';
  amountOrQuantity: string;
  costValue: string | null;
  reason: string;
  withdrawalDate: string | null;
  shipmentId: number | null;
  shipment?: {
    id: number;
    arrivalDate: string;
    totalCost: string;
    supplier: {
      id: number;
      name: string;
    };
  } | null;
  accountId: number | null;
  account?: {
    id: number;
    name: string;
    type: AccountType;
  } | null;
  createdAt: string;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
}

export interface CreateTransactionDto {
  accountId: number;
  amount: number;
  type: TransactionType;
  description?: string;
  linkedEntityId?: number;
  linkedEntityType?: string;
}

export interface CreatePartnerWithdrawalDto {
  userId?: number;
  type: 'cash' | 'goods';
  amountOrQuantity: string;
  costValue?: string;
  reason: string;
  accountId?: number;
  withdrawalDate?: string;
  shipmentId?: number;
}

export interface OtherExpense {
  id: number;
  accountId: number;
  account: {
    id: number;
    name: string;
    type: AccountType;
  };
  amount: string;
  category: string;
  description: string | null;
  expenseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOtherExpenseDto {
  accountId: number;
  amount: number;
  category: string;
  description?: string;
  expenseDate?: string;
}

export interface UpdateOtherExpenseDto {
  accountId?: number;
  amount?: number;
  category?: string;
  description?: string;
  expenseDate?: string;
}
