import type { TaskPriority, TaskStatus } from '../types/task'

export const TASK_STATUSES: Record<
  TaskStatus,
  { label: string; description: string }
> = {
  OPEN: {
    label: 'Open',
    description: 'Task is open and waiting to be started.',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Task is currently being worked on.',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Task has been completed.',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Task has been cancelled and will not be completed.',
  },
}

export const TASK_PRIORITIES: Record<
  TaskPriority,
  { label: string; color: string }
> = {
  LOW: {
    label: 'Low',
    color: 'gray',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'blue',
  },
  HIGH: {
    label: 'High',
    color: 'orange',
  },
  URGENT: {
    label: 'Urgent',
    color: 'red',
  },
}

export const TASK_STATUS_LIST = Object.keys(TASK_STATUSES) as TaskStatus[]
export const TASK_PRIORITY_LIST = Object.keys(TASK_PRIORITIES) as TaskPriority[]
