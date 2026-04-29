export interface TaskAssigneeUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isLocked: boolean;
  createdAt: string;
}

export interface TaskAssignee {
  id: string;
  user: TaskAssigneeUser;
  assigneeBy?: TaskAssigneeUser | null;
  assigneeAt: string;
  removedBy?: TaskAssigneeUser | null;
  removedAt?: string | null;
}

export interface AddTaskAssigneeRequest {
  userId: string;
}
