export interface InventoryItem {
  batchId: number;
  plantType: string;
  sizeCmMin: number;
  sizeCmMax: number;
  potType: string;
  quantityInitial: number;
  quantityCurrent: number;
  purchasePricePerUnit: number;
  shipmentId: number;
  arrivalDate: string;
  supplierName: string;
}

export interface WriteOff {
  id: number;
  batchId: number;
  batch: {
    id: number;
    plantType: string;
    sizeCmMin: number;
    sizeCmMax: number;
    potType: string;
  };
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: {
    id: number;
    fullName: string;
  };
}

export interface CreateWriteOffDto {
  batchId: number;
  quantity: number;
  reason: string;
  writeOffDate: string;
  comment?: string;
}

export interface InventoryRecalculateResult {
  updatedCount: number;
  updatedBatches: {
    batchId: number;
    previousQuantity: number;
    newQuantity: number;
    quantityInitial: number;
  }[];
}

export interface BatchDetails {
  batch: InventoryItem & { purchasePricePerUnit: number };
  shipment: {
    id: number;
    arrivalDate: string;
  };
  supplier: {
    id: number;
    name: string;
    phone?: string | null;
  };
  stats: {
    soldQuantity: number;
    cancelledQuantity: number;
    writeOffQuantity: number;
    availableQuantity: number;
  };
  recentSales: {
    saleId: number;
    saleDate: string;
    status: 'completed' | 'cancelled';
    clientName: string;
    quantity: number;
    pricePerUnit: string;
    totalAmount: string;
  }[];
  recentWriteOffs: {
    id: number;
    quantity: number;
    reason: string;
    writeOffDate: string;
    comment?: string | null;
  }[];
}
