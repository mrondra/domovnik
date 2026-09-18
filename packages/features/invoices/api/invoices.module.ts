import { Module } from '@nestjs/common';
import { InvoicesService } from '../service/index';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). It has no
 * controller yet — the endpoints and the screens arrive with task 018.
 */
@Module({ providers: [InvoicesService], exports: [InvoicesService] })
export class InvoicesModule {}
