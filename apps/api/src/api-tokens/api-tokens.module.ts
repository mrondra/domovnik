import { Module } from '@nestjs/common';
import { ApiTokensController } from './api-tokens.controller';

@Module({ controllers: [ApiTokensController] })
export class ApiTokensModule {}
