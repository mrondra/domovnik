import { Module } from '@nestjs/common';
import { ReceivablesService } from '../service/index';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). It has no
 * controller yet — the tools, the API and the seed arrive with task 013.
 */
@Module({ providers: [ReceivablesService], exports: [ReceivablesService] })
export class ReceivablesModule {}
