import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, Shipment, SaleItem])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService]
})
export class SuppliersModule {}

