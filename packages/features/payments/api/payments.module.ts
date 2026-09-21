import { Module } from '@nestjs/common';
import { PaymentsService } from '../service/index';
import { BankController } from './bank.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [BankController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
