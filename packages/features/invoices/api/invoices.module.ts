import { Module } from '@nestjs/common';
import { InvoicesService } from '../service/index';
import { InboundController } from './inbound.controller';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). The only
 * endpoint so far is the simulated inbox; the real ones arrive with task 018.
 */
@Module({
  controllers: [InboundController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
