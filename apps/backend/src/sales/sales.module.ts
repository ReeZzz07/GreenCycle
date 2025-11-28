import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Client } from '../clients/entities/client.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { UsersModule } from '../users/users.module';
import { FinanceModule } from '../finance/finance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';
import { Account } from '../finance/entities/account.entity';
import { Transaction } from '../finance/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Client, Batch, Account, Transaction]),
    UsersModule,
    FinanceModule,
    NotificationsModule,
    CommonModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}