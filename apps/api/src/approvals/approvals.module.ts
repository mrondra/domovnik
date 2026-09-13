import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { SignedLinkController } from './signed-link.controller';

@Module({ controllers: [ApprovalsController, SignedLinkController] })
export class ApprovalsModule {}
