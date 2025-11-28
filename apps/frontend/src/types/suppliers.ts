export interface Supplier {
  id: number;
  name: string;
  contactInfo: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  legalEntityName: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  bankName: string | null;
  bankAccount: string | null;
  correspondentAccount: string | null;
  bik: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactInfo?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  legalEntityName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  bankName?: string;
  bankAccount?: string;
  correspondentAccount?: string;
  bik?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactInfo?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  legalEntityName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  bankName?: string;
  bankAccount?: string;
  correspondentAccount?: string;
  bik?: string;
}
