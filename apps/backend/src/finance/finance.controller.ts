import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreatePartnerWithdrawalDto } from './dto/create-partner-withdrawal.dto';
import { CreateOtherExpenseDto } from './dto/create-other-expense.dto';
import { UpdateOtherExpenseDto } from './dto/update-other-expense.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Accounts
  @Roles('admin', 'super_admin')
  @Post('accounts')
  async createAccount(@Body() dto: CreateAccountDto) {
    const account = await this.financeService.createAccount(dto);
    return { data: account };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('accounts')
  async findAllAccounts() {
    const accounts = await this.financeService.findAllAccounts();
    return { data: accounts };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('accounts/:id')
  async findOneAccount(@Param('id', ParseIntPipe) id: number) {
    const account = await this.financeService.findOneAccount(id);
    return { data: account };
  }

  @Roles('admin', 'super_admin')
  @Patch('accounts/:id')
  async updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    const account = await this.financeService.updateAccount(id, dto);
    return { data: account };
  }

  @Roles('admin', 'super_admin')
  @Delete('accounts/:id')
  async removeAccount(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.removeAccount(id);
    return { data: true };
  }

  @Roles('admin', 'super_admin', 'accountant')
  @Post('accounts/:id/recalculate')
  async recalculateAccountBalance(@Param('id', ParseIntPipe) id: number) {
    const balance = await this.financeService.recalculateAccountBalance(id);
    return { data: { balance } };
  }

  // Transactions
  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Post('transactions')
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    const transaction = await this.financeService.createTransaction(dto, user.id);
    return { data: transaction };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('transactions')
  async findAllTransactions(@Query('accountId') accountId?: number) {
    const transactions = await this.financeService.findAllTransactions(
      accountId ? Number(accountId) : undefined,
    );
    return { data: transactions };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('transactions/:id')
  async findOneTransaction(@Param('id', ParseIntPipe) id: number) {
    const transaction = await this.financeService.findOneTransaction(id);
    return { data: transaction };
  }

  @Roles('admin', 'super_admin')
  @Delete('transactions/:id')
  async removeTransaction(@Param('id', ParseIntPipe) id: number) {
    const result = await this.financeService.removeTransaction(id);
    return { data: result };
  }

  @Roles('admin', 'super_admin')
  @Patch('transactions/:id/status')
  async updateTransactionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isCancelled') isCancelled: boolean,
    @CurrentUser() user: JwtUser,
  ) {
    const transaction = await this.financeService.updateTransactionStatus(
      id,
      isCancelled,
      user.id,
    );
    return { data: transaction };
  }

  // Partner Withdrawals
  @Roles('admin', 'super_admin')
  @Post('partner-withdrawals')
  async createPartnerWithdrawal(
    @Body() dto: CreatePartnerWithdrawalDto,
    @CurrentUser() user: JwtUser,
  ) {
    const withdrawal = await this.financeService.createPartnerWithdrawal(
      dto,
      user.id,
    );
    return { data: withdrawal };
  }

  @Roles('admin', 'super_admin', 'accountant')
  @Get('partner-withdrawals')
  async findAllPartnerWithdrawals() {
    const withdrawals = await this.financeService.findAllPartnerWithdrawals();
    return { data: withdrawals };
  }

  @Roles('admin', 'super_admin', 'accountant')
  @Get('partner-withdrawals/:id')
  async findOnePartnerWithdrawal(@Param('id', ParseIntPipe) id: number) {
    const withdrawal = await this.financeService.findOnePartnerWithdrawal(id);
    return { data: withdrawal };
  }

  @Roles('admin', 'super_admin')
  @Delete('partner-withdrawals/:id')
  async removePartnerWithdrawal(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.removePartnerWithdrawal(id);
    return { data: true };
  }

  // Other Expenses
  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Post('other-expenses')
  async createOtherExpense(
    @Body() dto: CreateOtherExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    const expense = await this.financeService.createOtherExpense(dto, user.id);
    return { data: expense };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('other-expenses')
  async findAllOtherExpenses(@Query('accountId') accountId?: number) {
    const expenses = await this.financeService.findAllOtherExpenses(
      accountId ? Number(accountId) : undefined,
    );
    return { data: expenses };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('other-expenses/:id')
  async findOneOtherExpense(@Param('id', ParseIntPipe) id: number) {
    const expense = await this.financeService.findOneOtherExpense(id);
    return { data: expense };
  }

  @Roles('admin', 'super_admin', 'accountant')
  @Patch('other-expenses/:id')
  async updateOtherExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOtherExpenseDto,
    @CurrentUser() user: JwtUser,
  ) {
    const expense = await this.financeService.updateOtherExpense(id, dto, user.id);
    return { data: expense };
  }

  @Roles('admin', 'super_admin')
  @Delete('other-expenses/:id')
  async removeOtherExpense(@Param('id', ParseIntPipe) id: number) {
    await this.financeService.removeOtherExpense(id);
    return { data: true };
  }
}
