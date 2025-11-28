import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Roles('admin', 'super_admin', 'logistic')
  @Post()
  async create(@Body() dto: CreateSupplierDto) {
    const supplier = await this.suppliersService.create(dto);
    return { data: supplier };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get()
  async findAll(@Query('search') search?: string) {
    const suppliers = await this.suppliersService.findAll(search);
    return { data: suppliers };
  }

  @Roles('admin', 'super_admin', 'logistic', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.suppliersService.findOne(id);
    return { data: supplier };
  }

  @Roles('admin', 'super_admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto
  ) {
    const supplier = await this.suppliersService.update(id, dto);
    return { data: supplier };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    await this.suppliersService.remove(id, user.role.name);
    return { data: true };
  }
}

