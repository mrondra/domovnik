import { Module } from '@nestjs/common';
import { SuppliersService } from '../service/index';
import { SuppliersController } from './suppliers.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
