import { Injectable } from '@nestjs/common';

/** The mutations and queries are functions in this folder; the service is the Nest seam for 032–034. */
@Injectable()
export class TasksService {
  readonly feature = 'tasks';
}
