import { Module } from '@nestjs/common';
import { TasksService } from '../service/tasks.service';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({ providers: [TasksService], exports: [TasksService] })
export class TasksModule {}
