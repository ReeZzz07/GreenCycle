import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateWriteOffDto } from './dto/create-write-off.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get()
  async getInventorySummary() {
    const summary = await this.inventoryService.getSummary();
    return { data: summary };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get(':batchId/details')
  async getBatchDetails(@Param('batchId', ParseIntPipe) batchId: number) {
    const details = await this.inventoryService.getBatchDetails(batchId);
    return { data: details };
  }

  @Roles('admin', 'super_admin', 'logistic')
  @Post('write-offs')
  async createWriteOff(@Body() dto: CreateWriteOffDto) {
    const writeOff = await this.inventoryService.createWriteOff(dto);
    return { data: writeOff };
  }

  @Roles('admin', 'super_admin')
  @Post('recalculate')
  async recalculateInventory() {
    const result = await this.inventoryService.recalculateStock();
    return { data: result };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get('write-offs')
  async listWriteOffs() {
    const writeOffs = await this.inventoryService.listWriteOffs();
    return { data: writeOffs };
  }
}

