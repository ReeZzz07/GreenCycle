export interface SaleItem {
  id: number;
  saleId: number;
  batchId: number;
  batch: {
    id: number;
    plantType: string;
    sizeCmMin: number;
    sizeCmMax: number;
    potType: string;
  };
  quantity: number;
  salePricePerUnit: string;
}

export interface Sale {
  id: number;
  clientId: number;
  client: {
    id: number;
    fullName: string;
  };
  saleDate: string;
  totalAmount: string;
  status: 'completed' | 'cancelled';
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
  transaction?: {
    id: number;
    accountId: number;
    account: {
      id: number;
      name: string;
      type: string;
    };
    amount: string;
    type: string;
    description: string | null;
    isCancelled: boolean;
    createdAt: string;
  } | null;
}

export interface CreateSaleItemDto {
  batchId: number;
  quantity: number;
  salePricePerUnit: number;
}

export interface CreateSaleDto {
  clientId: number;
  saleDate: string;
  items: CreateSaleItemDto[];
  accountId?: number;
}
