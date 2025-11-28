import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Buyback } from '../buybacks/entities/buyback.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Sale, Buyback])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
