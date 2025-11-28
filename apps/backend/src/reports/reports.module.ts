import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Buyback } from '../buybacks/entities/buyback.entity';
import { BuybackItem } from '../buybacks/entities/buyback-item.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { Client } from '../clients/entities/client.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { Account } from '../finance/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Buyback,
      BuybackItem,
      Shipment,
      Batch,
      Client,
      Transaction,
      Account,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
