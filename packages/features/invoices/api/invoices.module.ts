import { Module } from '@nestjs/common';
import { InvoicesService } from '../service/index';
import { InboundController } from './inbound.controller';
import { InvoicesController } from './invoices.controller';
import { SuppliersController } from './suppliers.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [InvoicesController, SuppliersController, InboundController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
