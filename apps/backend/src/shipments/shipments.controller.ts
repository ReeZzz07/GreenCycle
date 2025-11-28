import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { basename, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import type { Express } from 'express';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { DeleteShipmentDocumentDto } from './dto/delete-document.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { PdfService } from '../common/services/pdf.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

const DOCUMENTS_DIR = join(process.cwd(), 'uploads', 'documents');
const DOCUMENT_MAX_SIZE = 15 * 1024 * 1024; // 15MB
const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

const ensureDocumentsDir = () => {
  if (!existsSync(DOCUMENTS_DIR)) {
    mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
};

const decodeOriginalName = (name: string): string => {
  try {
    return Buffer.from(name, 'binary').toString('utf8');
  } catch {
    return name;
  }
};

const sanitizeFilename = (name: string): string => {
  // Разрешаем оригинальное имя, но защищаемся от символов каталогов
  const cleaned = name.replace(/[\\/]/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'document';
};

const documentStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureDocumentsDir();
    const uniqueDir = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const targetDir = join(DOCUMENTS_DIR, uniqueDir);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const decodedName = decodeOriginalName(file.originalname);
    const safeName = sanitizeFilename(basename(decodedName));
    (file as any).decodedOriginalName = decodedName;
    cb(null, safeName);
  },
});

const documentFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (!DOCUMENT_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new BadRequestException('Недопустимый формат файла'), false);
    return;
  }
  cb(null, true);
};

@Controller('shipments')
export class ShipmentsController {
  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly pdfService: PdfService,
  ) {}

  @Roles('admin', 'super_admin', 'logistic')
  @Post()
  async create(@Body() dto: CreateShipmentDto) {
    const shipment = await this.shipmentsService.create(dto);
    return { data: shipment };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get()
  async findAll() {
    const shipments = await this.shipmentsService.findAll();
    return { data: shipments };
  }

  @Roles('admin', 'super_admin', 'logistic')
  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: documentStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: DOCUMENT_MAX_SIZE },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }

    const normalizedPath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    const url = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    const originalName =
      (file as any).decodedOriginalName ?? decodeOriginalName(file.originalname);
    return { data: { url, name: originalName } };
  }

  @Roles('admin', 'super_admin', 'logistic')
  @Delete('documents')
  async deleteDocument(@Body() dto: DeleteShipmentDocumentDto) {
    if (!dto.url?.trim()) {
      throw new BadRequestException('Не указан URL документа');
    }
    await this.shipmentsService.deleteUploadedDocument(dto.url.trim());
    return { message: 'Документ удалён' };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const shipment = await this.shipmentsService.findOne(id);
    return { data: shipment };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get(':id/document')
  async generateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const shipment = await this.shipmentsService.findOne(id);

      if (!shipment.supplier) {
        throw new Error('Поставщик не найден');
      }

      const items = shipment.batches.map((batch) => ({
        plantType: batch.plantType || 'Не указано',
        size: `${batch.sizeCmMin}-${batch.sizeCmMax}см`,
        potType: batch.potType || 'Не указано',
        quantity: batch.quantityInitial || 0,
        price: parseFloat(batch.purchasePricePerUnit || '0'),
        total: (batch.quantityInitial || 0) * parseFloat(batch.purchasePricePerUnit || '0'),
      }));

      const pdfBuffer = await this.pdfService.generateShipmentDocument({
        shipmentNumber: `SHIP-${shipment.id}`,
        date: new Date(shipment.arrivalDate).toLocaleDateString('ru-RU'),
        supplierName: shipment.supplier.name || 'Не указано',
        items,
        total: parseFloat(shipment.totalCost || '0'),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=shipment-${shipment.id}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      throw error;
    }
  }

  @Roles('admin', 'super_admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShipmentDto,
  ) {
    const shipment = await this.shipmentsService.update(id, dto);
    return { data: shipment };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    await this.shipmentsService.remove(id, user.role.name);
    return { message: 'Поставка успешно удалена' };
  }

  @Roles('admin', 'super_admin')
  @Post('bulk/delete')
  async bulkRemove(
    @Body() dto: BulkDeleteDto,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.shipmentsService.bulkRemove(
      dto.ids,
      user.role.name,
    );
    return {
      data: {
        success: result.success,
        failed: result.failed,
        total: dto.ids.length,
        successCount: result.success.length,
        failedCount: result.failed.length,
      },
    };
  }
}

