import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { WriteOff } from './entities/write-off.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WriteOff, Batch, SaleItem])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService]
})
export class InventoryModule {}


