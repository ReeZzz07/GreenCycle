import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportParamsDto } from './dto/report-params.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('profit-by-shipment')
  async getProfitByShipment(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getProfitByShipment(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('profit-by-client')
  async getProfitByClient(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getProfitByClient(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('buyback-forecast')
  async getBuybackForecast(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getBuybackForecast(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant')
  @Get('cash-flow')
  async getCashFlow(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getCashFlow(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('client-activity')
  async getClientActivity(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getClientActivity(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'logistic')
  @Get('inventory-summary')
  async getInventorySummary() {
    const report = await this.reportsService.getInventorySummary();
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('sales-by-period')
  async getSalesByPeriod(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getSalesByPeriod(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('profit-by-plant-type')
  async getProfitByPlantType(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getProfitByPlantType(params);
    return { data: report };
  }

  @Roles('admin', 'super_admin', 'accountant', 'manager')
  @Get('returns-and-writeoffs')
  async getReturnsAndWriteoffs(@Query() params: ReportParamsDto) {
    const report = await this.reportsService.getReturnsAndWriteoffs(params);
    return { data: report };
  }
}
