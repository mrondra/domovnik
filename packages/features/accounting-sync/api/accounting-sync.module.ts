import { Module } from '@nestjs/common';
import { AccountingSyncService } from '../service/index';
import { AccountingController } from './accounting.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [AccountingController],
  providers: [AccountingSyncService],
  exports: [AccountingSyncService],
})
export class AccountingSyncModule {}
