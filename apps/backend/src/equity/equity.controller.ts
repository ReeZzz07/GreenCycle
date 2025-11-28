import { Controller, Get } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { EquityService, EquitySummary } from './equity.service';

@Controller('equity')
export class EquityController {
  constructor(private readonly equityService: EquityService) {}

  @Roles('super_admin')
  @Get()
  async getEquity(): Promise<{ data: EquitySummary }> {
    const equity = await this.equityService.calculateEquity();
    return { data: equity };
  }
}

