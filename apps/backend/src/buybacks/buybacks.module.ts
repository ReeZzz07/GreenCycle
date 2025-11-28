import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuybacksService } from './buybacks.service';
import { BuybacksController } from './buybacks.controller';
import { Buyback } from './entities/buyback.entity';
import { BuybackItem } from './entities/buyback-item.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Client } from '../clients/entities/client.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Buyback,
      BuybackItem,
      Sale,
      SaleItem,
      Client,
      Batch,
    ]),
    forwardRef(() => NotificationsModule),
    UsersModule,
    FinanceModule,
    InventoryModule,
    CommonModule,
  ],
  controllers: [BuybacksController],
  providers: [BuybacksService],
  exports: [BuybacksService],
})
export class BuybacksModule {}