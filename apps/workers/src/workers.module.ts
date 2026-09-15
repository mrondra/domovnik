import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';

/** Composition only (AGENTS.md §2): one provider whose lifecycle hooks are the process itself. */
@Module({ providers: [WorkersService] })
export class WorkersModule {}
