import { Module } from '@nestjs/common';
import { ReceivablesService } from '../service/index';
import { ReceivablesController } from './receivables.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [ReceivablesController],
  providers: [ReceivablesService],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
