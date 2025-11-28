import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Account } from '../finance/entities/account.entity';
import { Batch } from '../shipments/entities/batch.entity';
import { User } from '../users/entities/user.entity';
import { PartnerWithdrawal } from '../finance/entities/partner-withdrawal.entity';
import { Transaction } from '../finance/entities/transaction.entity';
import { ShipmentInvestment } from '../shipments/entities/shipment-investment.entity';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { OtherExpense } from '../finance/entities/other-expense.entity';

export interface OwnerEquity {
  userId: number;
  fullName: string;
  email: string;
  share: number; // Доля в процентах
  equityValue: string; // Доля выручки = (общая выручка - общие расходы) * доля в %
  availableCash: string; // Чистая прибыль = equityValue - денежные изъятия - вложения
  totalInvestments: string; // Общая сумма вложений
  totalWithdrawals: string; // Общая сумма денежных изъятий
}

export interface EquitySummary {
  totalAssets: string; // Общая стоимость активов
  cashAssets: string; // Денежные активы (балансы счетов)
  inventoryAssets: string; // Стоимость товаров на складе
  ownersCount: number; // Количество владельцев
  owners: OwnerEquity[]; // Доли каждого владельца
}

@Injectable()
export class EquityService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PartnerWithdrawal)
    private readonly partnerWithdrawalRepository: Repository<PartnerWithdrawal>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ShipmentInvestment)
    private readonly shipmentInvestmentRepository: Repository<ShipmentInvestment>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(OtherExpense)
    private readonly otherExpenseRepository: Repository<OtherExpense>,
  ) {}

  /**
   * Рассчитывает общую стоимость активов и распределяет их между владельцами
   */
  async calculateEquity(): Promise<EquitySummary> {
    // Получаем всех супер-администраторов
    const owners = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'super_admin' })
      .orderBy('user.fullName', 'ASC')
      .getMany();

    if (owners.length === 0) {
      return {
        totalAssets: '0.00',
        cashAssets: '0.00',
        inventoryAssets: '0.00',
        ownersCount: 0,
        owners: [],
      };
    }

    // Рассчитываем денежные активы (сумма балансов всех счетов)
    const cashAssetsResult = await this.accountRepository
      .createQueryBuilder('account')
      .select('COALESCE(SUM(account.balance::numeric), 0)', 'total')
      .getRawOne<{ total: string }>();

    const cashAssets = cashAssetsResult?.total || '0.00';

    // Рассчитываем стоимость товаров на складе
    // (quantity_current * purchase_price_per_unit для каждой партии)
    const inventoryAssetsResult = await this.batchRepository
      .createQueryBuilder('batch')
      .select(
        'COALESCE(SUM(batch.quantity_current::numeric * batch.purchase_price_per_unit::numeric), 0)',
        'total',
      )
      .getRawOne<{ total: string }>();

    const inventoryAssets = inventoryAssetsResult?.total || '0.00';

    // Общая стоимость активов (для отображения)
    const totalAssets = (
      parseFloat(cashAssets) + parseFloat(inventoryAssets)
    ).toFixed(2);

    // Получаем все изъятия партнеров для всех владельцев
    const ownerIds = owners.map((o) => o.id);
    const withdrawals = await this.partnerWithdrawalRepository.find({
      where: {
        userId: In(ownerIds),
      },
    });

    // Получаем все инвестиции в поставки для всех владельцев
    const shipmentInvestments = await this.shipmentInvestmentRepository.find({
      where: {
        userId: In(ownerIds),
      },
    });

    // Рассчитываем общую выручку из завершенных продаж
    const revenueResult = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .select('COALESCE(SUM(sale.total_amount::numeric), 0)', 'total')
      .getRawOne<{ total: string }>();

    const totalRevenue = parseFloat(revenueResult?.total || '0.00');

    // Рассчитываем общие прочие расходы
    const expensesResult = await this.otherExpenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount::numeric), 0)', 'total')
      .getRawOne<{ total: string }>();

    const totalExpenses = parseFloat(expensesResult?.total || '0.00');

    // Рассчитываем вложения для каждого владельца
    const ownersEquityData = await Promise.all(
      owners.map(async (owner) => {
        // Рассчитываем прямые вложения владельца (транзакции, не связанные с другими сущностями)
        const directInvestments = await this.transactionRepository
          .createQueryBuilder('transaction')
          .where('transaction.amount::numeric > 0')
          .andWhere('transaction.isCancelled = :isCancelled', { isCancelled: false })
          .andWhere('transaction.linkedEntityType IS NULL')
          .andWhere('transaction.createdById = :userId', { userId: owner.id })
          .select('COALESCE(SUM(transaction.amount::numeric), 0)', 'total')
          .getRawOne<{ total: string }>();

        const directInvestmentsAmount = parseFloat(directInvestments?.total || '0.00');

        // Рассчитываем инвестиции владельца в поставки
        const ownerShipmentInvestments = shipmentInvestments.filter(
          (inv) => inv.userId === owner.id,
        );
        const shipmentInvestmentsAmount = ownerShipmentInvestments.reduce(
          (sum, inv) => sum + parseFloat(inv.amount),
          0,
        );

        // Общая сумма вложений владельца = прямые транзакции + инвестиции в поставки
        const totalInvestments = (directInvestmentsAmount + shipmentInvestmentsAmount).toFixed(2);

        // Суммируем только денежные изъятия владельца
        // Изъятия товаров не учитываются, так как они уже отнимаются из вклада в закупки
        const ownerCashWithdrawals = withdrawals.filter(
          (w) => w.userId === owner.id && w.type === 'cash',
        );
        const totalWithdrawals = ownerCashWithdrawals.reduce(
          (sum, w) => sum + parseFloat(w.amountOrQuantity),
          0,
        );

        return {
          userId: owner.id,
          fullName: owner.fullName,
          email: owner.email,
          totalInvestments,
          totalWithdrawals: totalWithdrawals.toFixed(2),
          investmentAmount: parseFloat(totalInvestments), // Для расчета долей
        };
      }),
    );

    // Рассчитываем общую сумму всех вложений всех владельцев
    const totalInvestmentsAmount = ownersEquityData.reduce(
      (sum, owner) => sum + owner.investmentAmount,
      0,
    );

    // Рассчитываем доход после расходов (без учета вложений)
    // Это основа для расчета "Доли выручки"
    const revenueAfterExpenses = totalRevenue - totalExpenses;

    // Рассчитываем чистую прибыль = выручка - прочие расходы - общие вложения
    const netProfit = totalRevenue - totalExpenses - totalInvestmentsAmount;

    // Рассчитываем доли и распределяем прибыль пропорционально вложениям
    const ownersEquity: OwnerEquity[] = ownersEquityData.map((ownerData) => {
      let share: number;

      if (totalInvestmentsAmount > 0) {
        // Распределяем доли пропорционально вложениям
        share = (ownerData.investmentAmount / totalInvestmentsAmount) * 100;
      } else {
        // Если вложений нет, распределяем поровну
        share = 100 / owners.length;
      }

      // Доля выручки = (общая выручка - общие расходы) * доля в процентах
      const equityValue = ((revenueAfterExpenses * share) / 100).toFixed(2);

      // Чистая прибыль = доля выручки - денежные изъятия - вложения
      const availableCash = (
        parseFloat(equityValue) - parseFloat(ownerData.totalWithdrawals) - ownerData.investmentAmount
      ).toFixed(2);

      return {
        userId: ownerData.userId,
        fullName: ownerData.fullName,
        email: ownerData.email,
        share: parseFloat(share.toFixed(2)),
        equityValue,
        availableCash,
        totalInvestments: ownerData.totalInvestments,
        totalWithdrawals: ownerData.totalWithdrawals,
      };
    });

    return {
      totalAssets,
      cashAssets,
      inventoryAssets,
      ownersCount: owners.length,
      owners: ownersEquity,
    };
  }
}

