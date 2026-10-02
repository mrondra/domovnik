import './registry.generated';

export { TasksModule } from './api/tasks.module';
export {
  TasksService,
  assignTask,
  changeStatus,
  closeTasksForOrigin,
  commentTask,
  createTask,
  getTask,
  listTasks,
} from './service/index';

export { taskAssigned, taskCreated, taskStatusChanged } from './domain/events';
export { taskIdSchema } from './domain/ids';
export type { TaskId } from './domain/ids';
export type {
  CloseTasksOutcome,
  CreateTaskInput,
  ListTasksFilter,
  Task,
  TaskActivity,
  TaskActivityKind,
  TaskOrigin,
  TaskPriority,
  TaskStatus,
  TaskWithActivity,
} from './domain/types';
