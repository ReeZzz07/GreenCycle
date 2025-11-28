import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BuybacksService } from './buybacks.service';
import { CreateBuybackDto } from './dto/create-buyback.dto';
import { UpdateBuybackDto } from './dto/update-buyback.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { BuybackStatus } from './entities/buyback.entity';
import { PdfService } from '../common/services/pdf.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('buybacks')
export class BuybacksController {
  constructor(
    private readonly buybacksService: BuybacksService,
    private readonly pdfService: PdfService,
  ) {}

  @Roles('admin', 'super_admin', 'manager')
  @Post()
  async create(@Body() dto: CreateBuybackDto) {
    const buyback = await this.buybacksService.create(dto);
    return { data: buyback };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get()
  async findAll(@Query('status') status?: BuybackStatus) {
    const buybacks = await this.buybacksService.findAll(status);
    return { data: buybacks };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const buyback = await this.buybacksService.findOne(id);
    return { data: buyback };
  }

  @Roles('admin', 'super_admin', 'manager')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBuybackDto,
  ) {
    const buyback = await this.buybacksService.update(id, dto);
    return { data: buyback };
  }

  @Roles('admin', 'super_admin', 'manager')
  @Patch(':id/complete')
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body('actualDate') actualDate?: string,
  ) {
    const buyback = await this.buybacksService.complete(id, actualDate);
    return { data: buyback };
  }

  @Roles('admin', 'super_admin', 'manager')
  @Patch(':id/decline')
  async decline(@Param('id', ParseIntPipe) id: number) {
    const buyback = await this.buybacksService.decline(id);
    return { data: buyback };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id/act')
  async generateAct(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const buyback = await this.buybacksService.findOne(id);
    if (!buyback) {
      return res.status(404).json({ message: 'Выкуп не найден' });
    }

    const items = buyback.items.map((item) => ({
      name: `${item.originalSaleItem.batch.plantType} (${item.originalSaleItem.batch.sizeCmMin}-${item.originalSaleItem.batch.sizeCmMax}см, ${item.originalSaleItem.batch.potType})`,
      quantity: item.quantity,
      price: parseFloat(item.buybackPricePerUnit),
      condition: item.conditionNotes || 'Хорошее',
      total: item.quantity * parseFloat(item.buybackPricePerUnit),
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const pdfBuffer = await this.pdfService.generateBuybackAct({
      actNumber: `ACT-${buyback.id}`,
      date: buyback.actualDate
        ? new Date(buyback.actualDate).toLocaleDateString('ru-RU')
        : new Date(buyback.plannedDate).toLocaleDateString('ru-RU'),
      clientName: buyback.client.fullName,
      clientAddress: buyback.client.addressFull || 'Не указан',
      items,
      total,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=buyback-act-${buyback.id}.pdf`,
    );
    res.send(pdfBuffer);
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    await this.buybacksService.remove(id, user.role.name);
    return { message: 'Выкуп успешно удален' };
  }
}
