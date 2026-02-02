// Enums
export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskCategory {
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  DOCUMENTATION = 'DOCUMENTATION',
  RESEARCH = 'RESEARCH',
}

export enum Permission {
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  AUDIT_READ = 'audit:read',
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  TASK_CREATE = 'TASK_CREATE',
  TASK_READ = 'TASK_READ',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',
  AUDIT_READ = 'AUDIT_READ',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  DENIED = 'DENIED',
  ERROR = 'ERROR',
}

// Interfaces
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: number;
  createdAt: Date;
}

export interface Organization {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  orderIndex: number;
  organizationId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  userId: number;
  action: AuditAction;
  resource: string;
  result: AuditResult;
  metadata?: string;
}

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
    organizationId: number;
  };
}

export interface CreateTaskDto {
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  orderIndex?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  orderIndex?: number;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  organizationId: number;
}
