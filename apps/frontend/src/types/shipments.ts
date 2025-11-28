export interface Batch {
  id: number;
  plantType: string;
  sizeCmMin: number;
  sizeCmMax: number;
  potType: string;
  quantityInitial: number;
  quantityCurrent: number;
  purchasePricePerUnit: string;
  shipmentId: number;
}

export interface ShipmentDocumentAttachment {
  url: string;
  name?: string;
  persisted?: boolean;
}

export interface ShipmentInvestment {
  id: number;
  userId: number;
  user: {
    id: number;
    fullName: string;
  };
  amount: string;
  percentage: string;
}

export interface Shipment {
  id: number;
  supplierId: number;
  supplier: {
    id: number;
    name: string;
  };
  arrivalDate: string;
  documents: ShipmentDocumentAttachment[];
  totalCost: string;
  batches: Batch[];
  investments?: ShipmentInvestment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchDto {
  plantType: string;
  sizeCmMin: number;
  sizeCmMax: number;
  potType: string;
  quantityInitial: number;
  purchasePricePerUnit: number;
}

export interface CreateShipmentInvestmentDto {
  userId: number;
  amount: number;
}

export interface CreateShipmentDto {
  supplierId: number;
  arrivalDate: string;
  documents?: ShipmentDocumentAttachment[];
  batches: CreateBatchDto[];
  investments?: CreateShipmentInvestmentDto[];
}

export interface UpdateShipmentDto {
  supplierId?: number;
  arrivalDate?: string;
  documents?: ShipmentDocumentAttachment[];
  batches?: CreateBatchDto[];
  investments?: CreateShipmentInvestmentDto[];
}
