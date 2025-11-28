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
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { PdfService } from '../common/services/pdf.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly pdfService: PdfService,
  ) {}

  @Roles('admin', 'super_admin', 'manager')
  @Post()
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: JwtUser,
    @Query('accountId') accountId?: number,
  ) {
    const sale = await this.salesService.create(
      dto,
      user.id,
      accountId ? Number(accountId) : undefined,
    );
    return { data: sale };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get()
  async findAll() {
    const sales = await this.salesService.findAll();
    return { data: sales };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const sale = await this.salesService.findOne(id);
    return { data: sale };
  }

  @Roles('admin', 'super_admin')
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    const sale = await this.salesService.cancel(id, user.id);
    return { data: sale };
  }

  @Roles('admin', 'super_admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @CurrentUser() user: JwtUser,
  ) {
    if (status !== 'completed' && status !== 'cancelled') {
      throw new BadRequestException('Статус должен быть "completed" или "cancelled"');
    }
    const sale = await this.salesService.updateStatus(
      id,
      status as 'completed' | 'cancelled',
      user.id,
    );
    return { data: sale };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    await this.salesService.remove(id, user.role.name);
    return { message: 'Продажа успешно удалена' };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id/invoice')
  async generateInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const sale = await this.salesService.findOne(id);
    if (!sale) {
      return res.status(404).json({ message: 'Продажа не найдена' });
    }

    const items = sale.items.map((item) => ({
      name: `${item.batch.plantType} (${item.batch.sizeCmMin}-${item.batch.sizeCmMax}см, ${item.batch.potType})`,
      quantity: item.quantity,
      price: parseFloat(item.salePricePerUnit),
      total: item.quantity * parseFloat(item.salePricePerUnit),
    }));

    const pdfBuffer = await this.pdfService.generateInvoice({
      invoiceNumber: `INV-${sale.id}`,
      date: new Date(sale.saleDate).toLocaleDateString('ru-RU'),
      clientName: sale.client.fullName,
      clientAddress: sale.client.addressFull || 'Не указан',
      items,
      total: parseFloat(sale.totalAmount),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${sale.id}.pdf`,
    );
    res.send(pdfBuffer);
  }
}
