import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { Shipment } from './entities/shipment.entity';
import { Batch } from './entities/batch.entity';
import { ShipmentInvestment } from './entities/shipment-investment.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { User } from '../users/entities/user.entity';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { UsersModule } from '../users/users.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Batch, ShipmentInvestment, SaleItem, User]),
    SuppliersModule,
    UsersModule,
    FinanceModule,
    InventoryModule,
    CommonModule,
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService, TypeOrmModule],
})
export class ShipmentsModule {}