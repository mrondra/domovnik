import type { SvjId, UserId } from '../../../kernel/src/ids/index';
import type { TaskId } from './ids';

export type TaskStatus = 'open' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskActivityKind = 'comment' | 'status_changed' | 'assigned' | 'created';

export interface TaskOrigin {
  readonly type: string;
  readonly id: string;
}

export interface Task {
  readonly id: TaskId;
  readonly svjId: SvjId | null;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly departmentId: string;
  readonly assigneeId: UserId | null;
  readonly dueOn: string | null;
  readonly origin: TaskOrigin | null;
  readonly dedupeKey: string | null;
  readonly createdByAgentRunId: string | null;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
  /** Derived on read: `dueOn` is past and the status is still open. Never stored. */
  readonly overdue: boolean;
}

export interface TaskActivity {
  readonly id: string;
  readonly taskId: TaskId;
  readonly kind: TaskActivityKind;
  readonly body: string | null;
  readonly data: unknown;
  readonly actorType: 'user' | 'agent' | 'system';
  readonly actorId: string | null;
  readonly createdAt: Date;
}

export interface TaskWithActivity extends Task {
  readonly activity: readonly TaskActivity[];
}

interface CreateTaskCommon {
  readonly svjId?: SvjId;
  readonly title: string;
  readonly description?: string;
  readonly priority: TaskPriority;
  readonly assigneeId?: UserId;
  readonly dueOn?: string;
  readonly origin?: TaskOrigin;
  readonly dedupeKey?: string;
}

export type CreateTaskInput = CreateTaskCommon &
  (
    | { readonly departmentCode: string; readonly departmentId?: undefined }
    | { readonly departmentId: string; readonly departmentCode?: undefined }
  );

export interface ListTasksFilter {
  readonly departmentId?: string;
  readonly assigneeId?: UserId;
  readonly svjId?: SvjId;
  readonly status?: readonly TaskStatus[];
  readonly overdueOnly?: boolean;
  readonly originType?: string;
}

export interface CloseTasksOutcome {
  readonly status: 'done' | 'cancelled';
  readonly note: string;
}
