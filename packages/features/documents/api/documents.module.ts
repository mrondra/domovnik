import { Module } from '@nestjs/common';
import { DocumentsService } from '../service/index';

/**
 * Found by `apps/api` through the file name; nothing imports it by hand (AGENTS.md §6). It has no
 * controller yet: in phase 1 only the server stores documents, so nothing is exposed over HTTP.
 */
@Module({ providers: [DocumentsService], exports: [DocumentsService] })
export class DocumentsModule {}
