import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { PartnerWithdrawal } from './entities/partner-withdrawal.entity';
import { OtherExpense } from './entities/other-expense.entity';
import { User } from '../users/entities/user.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { ShipmentInvestment } from '../shipments/entities/shipment-investment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Transaction,
      PartnerWithdrawal,
      OtherExpense,
      User,
      Sale,
      Shipment,
      Batch,
      ShipmentInvestment,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
