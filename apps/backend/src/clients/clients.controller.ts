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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { memoryStorage } = require('multer');

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Roles('admin', 'super_admin', 'manager')
  @Post()
  async create(@Body() dto: CreateClientDto) {
    const client = await this.clientsService.create(dto);
    return { data: client };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get()
  async findAll(@Query('search') search?: string) {
    const clients = await this.clientsService.findAll(search);
    return { data: clients };
  }

  @Roles('admin', 'super_admin', 'manager', 'accountant')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const client = await this.clientsService.findOne(id);
    return { data: client };
  }

  @Roles('admin', 'super_admin', 'manager')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    const client = await this.clientsService.update(id, dto);
    return { data: client };
  }

  @Roles('admin', 'super_admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    await this.clientsService.remove(id, user.role.name);
    return { data: true };
  }

  @Roles('admin', 'super_admin')
  @Post('bulk/delete')
  async bulkRemove(
    @Body() dto: BulkDeleteDto,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.clientsService.bulkRemove(
      dto.ids,
      user.role.name,
    );
    return {
      data: {
        success: result.success,
        failed: result.failed,
        total: dto.ids.length,
        successCount: result.success.length,
        failedCount: result.failed.length,
      },
    };
  }

  @Roles('admin', 'super_admin', 'manager')
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error('Поддерживаются только файлы Excel (.xlsx, .xls)'),
            false,
          );
        }
      },
    }),
  )
  async importFromExcel(@UploadedFile() file: any) {
    const result = await this.clientsService.importFromExcel(file);
    return {
      data: {
        success: result.success,
        failed: result.failed,
        total: result.total,
        successCount: result.success,
        failedCount: result.failed.length,
      },
    };
  }
}
