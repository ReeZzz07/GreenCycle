export enum BuybackStatus {
  PLANNED = 'planned',
  CONTACTED = 'contacted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
}

export interface BuybackItem {
  id: number;
  buybackId: number;
  originalSaleItemId: number;
  originalSaleItem: {
    id: number;
    batch: {
      id: number;
      plantType: string;
      purchasePricePerUnit: string;
    };
  };
  quantity: number;
  buybackPricePerUnit: string;
  conditionNotes: string | null;
}

export interface Buyback {
  id: number;
  originalSaleId: number;
  originalSale: {
    id: number;
    saleDate: string;
  };
  clientId: number;
  client: {
    id: number;
    fullName: string;
  };
  plannedDate: string;
  actualDate: string | null;
  status: BuybackStatus;
  notes: string | null;
  items: BuybackItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuybackItemDto {
  originalSaleItemId: number;
  quantity: number;
  buybackPricePerUnit: number;
  conditionNotes?: string;
}

export interface CreateBuybackDto {
  originalSaleId: number;
  clientId: number;
  plannedDate: string;
  actualDate?: string;
  status?: BuybackStatus;
  notes?: string;
  items: CreateBuybackItemDto[];
}

export interface UpdateBuybackDto {
  plannedDate?: string;
  actualDate?: string;
  status?: BuybackStatus;
  notes?: string;
}
