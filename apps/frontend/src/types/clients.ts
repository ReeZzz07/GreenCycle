export enum ClientType {
  INDIVIDUAL = 'individual',
  LEGAL_ENTITY = 'legal_entity',
}

export interface Client {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  addressFull: string | null;
  clientType: ClientType;
  legalEntityName: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  bankName: string | null;
  bankAccount: string | null;
  correspondentAccount: string | null;
  bik: string | null;
  firstPurchaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  fullName: string;
  phone?: string;
  email?: string;
  addressFull?: string;
  clientType?: ClientType;
  legalEntityName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  bankName?: string;
  bankAccount?: string;
  correspondentAccount?: string;
  bik?: string;
}

export interface UpdateClientDto {
  fullName?: string;
  phone?: string;
  email?: string;
  addressFull?: string;
  clientType?: ClientType;
  legalEntityName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  bankName?: string;
  bankAccount?: string;
  correspondentAccount?: string;
  bik?: string;
}
