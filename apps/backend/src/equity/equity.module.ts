import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquityService } from './equity.service';
import { EquityController } from './equity.controller';
import { Account } from '../finance/entities/account.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { User } from '../users/entities/user.entity';
import { PartnerWithdrawal } from '../finance/entities/partner-withdrawal.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { ShipmentInvestment } from '../shipments/entities/shipment-investment.entity';
import { Sale } from '../sales/entities/sale.entity';
import { OtherExpense } from '../finance/entities/other-expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Batch,
      User,
      PartnerWithdrawal,
      Transaction,
      ShipmentInvestment,
      Sale,
      OtherExpense,
    ]),
  ],
  controllers: [EquityController],
  providers: [EquityService],
  exports: [EquityService],
})
export class EquityModule {}

