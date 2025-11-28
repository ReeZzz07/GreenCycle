import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShipmentsService } from './shipments.service';
import { Shipment } from './entities/shipment.entity';
import { Batch } from './entities/batch.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { NotFoundException } from '@nestjs/common';

describe('ShipmentsService', () => {
  let service: ShipmentsService;
  let shipmentRepository: jest.Mocked<Repository<Shipment>>;
  let batchRepository: jest.Mocked<Repository<Batch>>;
  let saleItemRepository: jest.Mocked<Repository<SaleItem>>;
  let suppliersService: jest.Mocked<SuppliersService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockShipment: Partial<Shipment> = {
    id: 1,
    supplierId: 1,
    arrivalDate: '2024-01-15',
    totalCost: '1000.00',
    documentUrl: null,
    batches: [],
    supplier: {
      id: 1,
      name: 'Test Supplier',
    } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: null,
    updatedById: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((cb) => cb({
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        getRepository: jest.fn(() => mockRepository),
      })),
    };

    const mockSuppliersService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        {
          provide: getRepositoryToken(Shipment),
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
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
    shipmentRepository = module.get(getRepositoryToken(Shipment));
    batchRepository = module.get(getRepositoryToken(Batch));
    saleItemRepository = module.get(getRepositoryToken(SaleItem));
    suppliersService = module.get(SuppliersService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of shipments', async () => {
      const shipments = [mockShipment as Shipment];
      shipmentRepository.find.mockResolvedValue(shipments);

      const result = await service.findAll();

      expect(result).toEqual(shipments);
      expect(shipmentRepository.find).toHaveBeenCalledWith({
        relations: { batches: true, supplier: true },
        order: { arrivalDate: 'DESC', id: 'DESC' },
      });
    });

    it('should return empty array when no shipments exist', async () => {
      shipmentRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a shipment when found', async () => {
      shipmentRepository.findOne.mockResolvedValue(mockShipment as Shipment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockShipment);
      expect(shipmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { batches: true, supplier: true },
      });
    });

    it('should throw NotFoundException when shipment not found', async () => {
      shipmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Поставка #999 не найдена');
    });
  });
});

