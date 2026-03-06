export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date | null
  organizationId: string
  projectId?: string | null
  assigneeId?: string | null
  creatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface TaskWithRelations extends Task {
  project?: {
    id: string
    name: string
    number: string
  } | null
  assignee?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  creator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: Date
  projectId?: string
  assigneeId?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: Date | null
  projectId?: string | null
  assigneeId?: string | null
}
