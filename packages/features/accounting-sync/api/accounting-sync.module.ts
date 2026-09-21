import { Module } from '@nestjs/common';
import { AccountingSyncService } from '../service/index';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). It has no
 * controller yet — the flow and the conflict screens arrive with task 025.
 */
@Module({ providers: [AccountingSyncService], exports: [AccountingSyncService] })
export class AccountingSyncModule {}
