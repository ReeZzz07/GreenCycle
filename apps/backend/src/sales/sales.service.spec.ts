import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Client } from '../clients/entities/client.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { Account } from '../finance/entities/account.entity';
import { Transaction, LinkedEntityType } from '../finance/entities/transaction.entity';
import { FinanceService } from '../finance/finance.service';
import { NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let saleRepository: jest.Mocked<Repository<Sale>>;
  let transactionRepository: jest.Mocked<Repository<Transaction>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockSale: Partial<Sale> = {
    id: 1,
    clientId: 1,
    saleDate: '2024-01-15',
    totalAmount: '1000.00',
    status: SaleStatus.COMPLETED,
    client: {
      id: 1,
      fullName: 'Test Client',
    } as Client,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: null,
    updatedById: null,
  };

  const mockTransaction: Partial<Transaction> = {
    id: 1,
    accountId: 1,
    amount: '1000.00',
    linkedEntityId: 1,
    linkedEntityType: LinkedEntityType.SALE,
    account: {
      id: 1,
      name: 'Test Account',
    } as Account,
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Batch),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: FinanceService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    saleRepository = module.get(getRepositoryToken(Sale));
    transactionRepository = module.get(getRepositoryToken(Transaction));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of sales', async () => {
      const sales = [mockSale as Sale];
      saleRepository.find.mockResolvedValue(sales);

      const result = await service.findAll();

      expect(result).toEqual(sales);
      expect(saleRepository.find).toHaveBeenCalledWith({
        relations: ['client', 'items', 'items.batch'],
        order: { saleDate: 'DESC', id: 'DESC' },
      });
    });

    it('should return empty array when no sales exist', async () => {
      saleRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a sale with transaction', async () => {
      saleRepository.findOne.mockResolvedValue(mockSale as Sale);
      transactionRepository.findOne.mockResolvedValue(mockTransaction as Transaction);

      const result = await service.findOne(1);

      expect(result.id).toBe(mockSale.id);
      expect(result.transaction).toEqual(mockTransaction);
      expect(saleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['client', 'items', 'items.batch'],
      });
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: {
          linkedEntityId: 1,
          linkedEntityType: LinkedEntityType.SALE,
        },
        relations: ['account'],
        order: { id: 'ASC' },
      });
    });

    it('should return a sale without transaction when transaction not found', async () => {
      // Сбрасываем моки перед тестом
      jest.clearAllMocks();
      saleRepository.findOne.mockResolvedValueOnce(mockSale as Sale);
      transactionRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.findOne(1);

      expect(result.id).toBe(mockSale.id);
      expect(result.transaction).toBeNull();
    });

    it('should throw NotFoundException when sale not found', async () => {
      saleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Продажа #999 не найдена');
    });
  });
});

