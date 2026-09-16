import { Module } from '@nestjs/common';
import { SvjService } from '../service/index';
import { DepartmentsController } from './departments.controller';
import { SvjController } from './svj.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [SvjController, DepartmentsController],
  providers: [SvjService],
  exports: [SvjService],
})
export class SvjModule {}
