import { Module } from '@nestjs/common';
import { PaymentsService } from '../service/index';
import { BankController } from './bank.controller';
import { PaymentsController } from './payments.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [PaymentsController, BankController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
