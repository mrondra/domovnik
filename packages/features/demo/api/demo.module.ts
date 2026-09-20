import { Module } from '@nestjs/common';
import { DemoService } from '../service/index';
import { DemoController } from './demo.controller';

/** Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). */
@Module({ controllers: [DemoController], providers: [DemoService], exports: [DemoService] })
export class DemoModule {}
