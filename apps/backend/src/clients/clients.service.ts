import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Client, ClientType } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Buyback, BuybackStatus } from '../buybacks/entities/buyback.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create({
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.trim().toLowerCase() ?? null,
      addressFull: dto.addressFull?.trim() ?? null,
      clientType: dto.clientType ?? ClientType.INDIVIDUAL,
      legalEntityName: dto.legalEntityName?.trim() ?? null,
      inn: dto.inn?.trim() ?? null,
      kpp: dto.kpp?.trim() ?? null,
      ogrn: dto.ogrn?.trim() ?? null,
      bankName: dto.bankName?.trim() ?? null,
      bankAccount: dto.bankAccount?.trim() ?? null,
      correspondentAccount: dto.correspondentAccount?.trim() ?? null,
      bik: dto.bik?.trim() ?? null,
    });
    const savedClient = await this.clientRepository.save(client);

    // Инвалидируем кэш списка клиентов
    await this.invalidateClientsCache();

    return savedClient;
  }

  private async invalidateClientsCache(): Promise<void> {
    // Удаляем все ключи кэша, связанные с клиентами
    try {
      const store = (this.cacheManager as any).store;
      if (store && typeof store.keys === 'function') {
        const keys = await store.keys('clients:*');
        if (Array.isArray(keys)) {
          for (const key of keys) {
            await this.cacheManager.del(key);
          }
        }
      } else {
        // Если метод keys недоступен, удаляем известные ключи
        await this.cacheManager.del('clients:all:no-search');
        // Можно добавить удаление других возможных ключей
      }
    } catch (error) {
      // Игнорируем ошибки при инвалидации кэша
      console.warn('Failed to invalidate clients cache:', error);
    }
  }

  async findAll(search?: string): Promise<Client[]> {
    // Генерируем ключ кэша на основе параметра поиска
    const cacheKey = `clients:all:${search || 'no-search'}`;

    // Пытаемся получить данные из кэша
    const cached = await this.cacheManager.get<Client[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: FindOptionsWhere<Client>[] | undefined = search
      ? [
          { fullName: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : undefined;

    const clients = await this.clientRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    // Сохраняем в кэш на 5 минут
    await this.cacheManager.set(cacheKey, clients, 300);

    return clients;
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Клиент #${id} не найден`);
    }
    return client;
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    if (dto.fullName !== undefined) {
      client.fullName = dto.fullName.trim();
    }
    if (dto.phone !== undefined) {
      const trimmed = dto.phone?.trim();
      client.phone = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.email !== undefined) {
      const trimmed = dto.email?.trim();
      client.email = trimmed && trimmed.length > 0 ? trimmed.toLowerCase() : null;
    }
    if (dto.addressFull !== undefined) {
      const trimmed = dto.addressFull?.trim();
      client.addressFull = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.clientType !== undefined) {
      client.clientType = dto.clientType;
    }
    if (dto.legalEntityName !== undefined) {
      const trimmed = dto.legalEntityName?.trim();
      client.legalEntityName = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.inn !== undefined) {
      const trimmed = dto.inn?.trim();
      client.inn = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.kpp !== undefined) {
      const trimmed = dto.kpp?.trim();
      client.kpp = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.ogrn !== undefined) {
      const trimmed = dto.ogrn?.trim();
      client.ogrn = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.bankName !== undefined) {
      const trimmed = dto.bankName?.trim();
      client.bankName = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.bankAccount !== undefined) {
      const trimmed = dto.bankAccount?.trim();
      client.bankAccount = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.correspondentAccount !== undefined) {
      const trimmed = dto.correspondentAccount?.trim();
      client.correspondentAccount = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.bik !== undefined) {
      const trimmed = dto.bik?.trim();
      client.bik = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    const savedClient = await this.clientRepository.save(client);

    // Инвалидируем кэш списка клиентов
    await this.invalidateClientsCache();

    return savedClient;
  }

  async remove(id: number, userRole?: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const client = await manager.findOne(Client, { where: { id } });

      if (!client) {
        throw new NotFoundException(`Клиент #${id} не найден`);
      }

      // Проверяем, есть ли связанные продажи
      const relatedSales = await manager.find(Sale, {
        where: { clientId: id },
      });

      // Проверяем, есть ли связанные выкупы
      const relatedBuybacks = await manager.find(Buyback, {
        where: { clientId: id },
      });

      if (relatedSales.length > 0 || relatedBuybacks.length > 0) {
        // Проверяем, все ли связанные продажи отменены
        const allSalesCancelled =
          relatedSales.length === 0 ||
          relatedSales.every((sale) => sale.status === SaleStatus.CANCELLED);

        // Проверяем, все ли связанные выкупы отменены
        const allBuybacksDeclined =
          relatedBuybacks.length === 0 ||
          relatedBuybacks.every(
            (buyback) => buyback.status === BuybackStatus.DECLINED,
          );

        if (!allSalesCancelled || !allBuybacksDeclined) {
          throw new BadRequestException(
            'Нельзя удалить клиента, связанного с активными продажами или выкупами. Удалите связанные записи или отмените их.',
          );
        }

        // Если все связанные сущности отменены, проверяем роль пользователя
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';
        if (!isAdmin) {
          throw new BadRequestException(
            'Нельзя удалить клиента, связанного с отмененными продажами или выкупами. Только администратор может удалить таких клиентов.',
          );
        }

        // Сначала удаляем связанные отмененные выкупы (они могут ссылаться на продажи)
        if (relatedBuybacks.length > 0) {
          const declinedBuybacks = relatedBuybacks.filter(
            (buyback) => buyback.status === BuybackStatus.DECLINED,
          );
          if (declinedBuybacks.length > 0) {
            await manager.remove(declinedBuybacks);
          }
        }

        // Затем удаляем связанные отмененные продажи
        if (relatedSales.length > 0) {
          const cancelledSales = relatedSales.filter(
            (sale) => sale.status === SaleStatus.CANCELLED,
          );
          if (cancelledSales.length > 0) {
            await manager.remove(cancelledSales);
          }
        }
      }

      // Удаляем клиента
      await manager.remove(client);
    });

    // Инвалидируем кэш списка клиентов
    await this.invalidateClientsCache();
  }

  async bulkRemove(ids: number[], userRole?: string): Promise<{
    success: number[];
    failed: Array<{ id: number; error: string }>;
  }> {
    const success: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    for (const id of ids) {
      try {
        await this.remove(id, userRole);
        success.push(id);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Неизвестная ошибка при удалении';
        failed.push({ id, error: errorMessage });
      }
    }

    // Инвалидируем кэш после массового удаления
    await this.invalidateClientsCache();

    return { success, failed };
  }

  async findByPhone(phone: string): Promise<Client | null> {
    return await this.clientRepository.findOne({
      where: { phone: phone.trim() },
    });
  }

  async findByEmail(email: string): Promise<Client | null> {
    return await this.clientRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async updateFirstPurchaseDate(id: number, date: Date): Promise<void> {
    const client = await this.findOne(id);
    if (!client.firstPurchaseDate) {
      client.firstPurchaseDate = date;
      await this.clientRepository.save(client);
    }
  }

  async importFromExcel(file: any): Promise<{
    success: number;
    failed: Array<{ row: number; error: string; data: Record<string, unknown> }>;
    total: number;
  }> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // Проверяем расширение файла
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      throw new BadRequestException('Поддерживаются только файлы Excel (.xlsx, .xls)');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (error) {
      throw new BadRequestException('Не удалось прочитать файл Excel');
    }

    // Берем первый лист
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Файл Excel не содержит листов');
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Файл Excel не содержит данных');
    }

    const success: number[] = [];
    const failed: Array<{ row: number; error: string; data: Record<string, unknown> }> = [];

    // Ожидаемые колонки (гибкий формат - ищем по различным вариантам названий)
    const columnMapping: Record<string, string[]> = {
      fullName: ['ФИО', 'ФИО клиента', 'Имя', 'Имя клиента', 'fullName', 'full_name'],
      phone: ['Телефон', 'Номер телефона', 'phone', 'phone_number'],
      email: ['Email', 'Электронная почта', 'email', 'e-mail'],
      addressFull: ['Адрес', 'Адрес клиента', 'address', 'addressFull', 'address_full'],
      clientType: ['Тип', 'Тип клиента', 'clientType', 'client_type'],
      legalEntityName: ['Название юр. лица', 'Юридическое лицо', 'legalEntityName', 'legal_entity_name'],
      inn: ['ИНН', 'inn'],
      kpp: ['КПП', 'kpp'],
      ogrn: ['ОГРН', 'ogrn'],
      bankName: ['Банк', 'Название банка', 'bankName', 'bank_name'],
      bankAccount: ['Расчетный счет', 'Счет', 'bankAccount', 'bank_account'],
      correspondentAccount: ['Корреспондентский счет', 'correspondentAccount', 'correspondent_account'],
      bik: ['БИК', 'bik'],
    };

    // Находим названия колонок
    const columnNames: Record<string, string> = {};
    const firstRow = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow);

    Object.entries(columnMapping).forEach(([field, variants]) => {
      const foundHeader = headers.find((h) =>
        variants.some((v) => h.toLowerCase().trim() === v.toLowerCase().trim()),
      );
      if (foundHeader) {
        columnNames[field] = foundHeader;
      }
    });

    // Проверяем наличие обязательного поля ФИО
    if (!columnNames.fullName) {
      throw new BadRequestException(
        'Не найдена обязательная колонка "ФИО" (или "ФИО клиента", "Имя")',
      );
    }

    // Обрабатываем каждую строку
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rowNumber = i + 2; // +2 потому что первая строка - заголовки, нумерация с 1

      try {
        // Извлекаем данные из строки
        const fullName = String(row[columnNames.fullName] || '').trim();
        if (!fullName) {
          failed.push({
            row: rowNumber,
            error: 'ФИО не может быть пустым',
            data: row,
          });
          continue;
        }

        const phone = columnNames.phone
          ? String(row[columnNames.phone] || '').trim() || null
          : null;
        const email = columnNames.email
          ? String(row[columnNames.email] || '').trim() || null
          : null;
        const addressFull = columnNames.addressFull
          ? String(row[columnNames.addressFull] || '').trim() || null
          : null;

        // Определяем тип клиента
        let clientType = ClientType.INDIVIDUAL;
        if (columnNames.clientType) {
          const typeValue = String(row[columnNames.clientType] || '').trim().toLowerCase();
          if (typeValue.includes('юр') || typeValue.includes('legal') || typeValue === '2') {
            clientType = ClientType.LEGAL_ENTITY;
          }
        }

        // Проверяем, не существует ли уже клиент с таким email или телефоном
        if (email) {
          const existingByEmail = await this.findByEmail(email);
          if (existingByEmail) {
            failed.push({
              row: rowNumber,
              error: `Клиент с email "${email}" уже существует`,
              data: row,
            });
            continue;
          }
        }

        if (phone) {
          const existingByPhone = await this.findByPhone(phone);
          if (existingByPhone) {
            failed.push({
              row: rowNumber,
              error: `Клиент с телефоном "${phone}" уже существует`,
              data: row,
            });
            continue;
          }
        }

        // Создаем DTO для клиента
        const createDto: CreateClientDto = {
          fullName,
          phone: phone || undefined,
          email: email || undefined,
          addressFull: addressFull || undefined,
          clientType,
        };

        // Добавляем данные юридического лица, если они есть
        if (clientType === ClientType.LEGAL_ENTITY) {
          if (columnNames.legalEntityName) {
            const legalEntityName = String(row[columnNames.legalEntityName] || '').trim();
            if (legalEntityName) {
              createDto.legalEntityName = legalEntityName;
            }
          }
          if (columnNames.inn) {
            const inn = String(row[columnNames.inn] || '').trim();
            if (inn) {
              createDto.inn = inn;
            }
          }
          if (columnNames.kpp) {
            const kpp = String(row[columnNames.kpp] || '').trim();
            if (kpp) {
              createDto.kpp = kpp;
            }
          }
          if (columnNames.ogrn) {
            const ogrn = String(row[columnNames.ogrn] || '').trim();
            if (ogrn) {
              createDto.ogrn = ogrn;
            }
          }
          if (columnNames.bankName) {
            const bankName = String(row[columnNames.bankName] || '').trim();
            if (bankName) {
              createDto.bankName = bankName;
            }
          }
          if (columnNames.bankAccount) {
            const bankAccount = String(row[columnNames.bankAccount] || '').trim();
            if (bankAccount) {
              createDto.bankAccount = bankAccount;
            }
          }
          if (columnNames.correspondentAccount) {
            const correspondentAccount = String(row[columnNames.correspondentAccount] || '').trim();
            if (correspondentAccount) {
              createDto.correspondentAccount = correspondentAccount;
            }
          }
          if (columnNames.bik) {
            const bik = String(row[columnNames.bik] || '').trim();
            if (bik) {
              createDto.bik = bik;
            }
          }
        }

        // Создаем клиента
        const client = await this.create(createDto);
        success.push(client.id);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Неизвестная ошибка при создании клиента';
        failed.push({
          row: rowNumber,
          error: errorMessage,
          data: row,
        });
      }
    }

    // Инвалидируем кэш после импорта
    await this.invalidateClientsCache();

    return {
      success: success.length,
      failed,
      total: data.length,
    };
  }
}
