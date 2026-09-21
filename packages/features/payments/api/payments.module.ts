import { Module } from '@nestjs/common';
import { PaymentsService } from '../service/index';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). It has no
 * controller yet — the endpoints and the screens arrive with task 023.
 */
@Module({ providers: [PaymentsService], exports: [PaymentsService] })
export class PaymentsModule {}
