# System Architecture Documentation

## Overview

This document provides a comprehensive overview of the Task Management System architecture, including component interactions, data flow, and security implementation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Angular Dashboard (Port 4200)                 │   │
│  │  - Login Component                                    │   │
│  │  - Dashboard Component (Drag & Drop)                  │   │
│  │  - Auth Service (JWT storage)                         │   │
│  │  - Task Service (State management)                    │   │
│  │  - HTTP Interceptor (Auto-attach JWT)                │   │
│  │  - Route Guard (Protected routes)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         NestJS Backend (Port 3000)                    │   │
│  │                                                        │   │
│  │  Global Guards:                                        │   │
│  │  ├─ JwtAuthGuard (APP_GUARD)                          │   │
│  │  └─ PermissionsGuard (APP_GUARD)                      │   │
│  │                                                        │   │
│  │  Modules:                                              │   │
│  │  ├─ AuthModule (/auth/login)                          │   │
│  │  ├─ TasksModule (/tasks/*)                            │   │
│  │  └─ AuditModule (/audit-log)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   RBAC Library (@app/auth)            │   │
│  │  - RBACService.hasPermission()                        │   │
│  │  - RBACService.canAccessOrganization()                │   │
│  │  - RBACService.canPerformAction()                     │   │
│  │  - Role → Permission mapping                          │   │
│  │  - Organization hierarchy logic                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Data Models (@app/data)                   │   │
│  │  - Interfaces (User, Task, Organization, AuditLog)    │   │
│  │  - DTOs (CreateTaskDto, UpdateTaskDto, LoginDto)      │   │
│  │  - Enums (UserRole, TaskStatus, Permission)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              TypeORM Entities                         │   │
│  │  - UserEntity                                         │   │
│  │  - OrganizationEntity                                 │   │
│  │  - TaskEntity                                         │   │
│  │  - AuditLogEntity                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            SQLite (database.sqlite)                   │   │
│  │  Tables: users, organizations, tasks, audit_logs     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow: Create Task

```
1. User clicks "Create Task" button
   │
   ├─> Angular: DashboardComponent.openCreateModal()
   │
2. User fills form and submits
   │
   ├─> Angular: DashboardComponent.saveTask()
   │   └─> TaskService.createTask(dto)
   │
3. HTTP Request sent with JWT
   │
   ├─> HTTP Interceptor attaches Bearer token
   │   └─> POST http://localhost:3000/tasks
   │
4. Backend receives request
   │
   ├─> NestJS: JwtAuthGuard validates token
   │   ├─> Passport JWT Strategy
   │   ├─> Queries UserEntity from database
   │   └─> Attaches user to request object
   │
   ├─> NestJS: PermissionsGuard checks permissions
   │   ├─> Reads @RequirePermissions decorator
   │   ├─> RBACService.hasPermission(role, permission)
   │   └─> Returns true/false
   │
   ├─> NestJS: TasksController.create()
   │   └─> Calls TasksService.create()
   │
5. Service layer processing
   │
   ├─> TasksService.create(dto, user)
   │   ├─> Validates permission (double-check)
   │   ├─> Creates TaskEntity with user's org ID
   │   ├─> Saves to database via TypeORM
   │   ├─> AuditService.log(success)
   │   └─> Returns created task
   │
6. Response sent back
   │
   ├─> HTTP 201 Created with task object
   │
7. Frontend updates
   │
   ├─> TaskService updates BehaviorSubject
   ├─> Dashboard component receives update via Observable
   └─> UI re-renders with new task
```

## Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /auth/login
       │    { email, password }
       ↓
┌─────────────────┐
│  AuthController │
└────────┬────────┘
         │
         │ 2. Validate credentials
         ↓
┌─────────────┐
│ AuthService │
└──────┬──────┘
       │
       │ 3. Query User from DB
       │ 4. bcrypt.compare(password, hash)
       ↓
┌──────────────┐
│   Database   │
└──────┬───────┘
       │
       │ 5. User found & password valid
       ↓
┌─────────────┐
│ JwtService  │ 6. Sign JWT with payload:
└──────┬──────┘    { sub, email, role, orgId }
       │
       │ 7. Return token + user
       ↓
┌─────────────────┐
│  Frontend       │
│  - localStorage │ 8. Store token
│  - BehaviorSub. │ 9. Update auth state
└─────────────────┘
```

## RBAC Decision Flow

```
User makes request to update Task #5
↓
┌──────────────────────────────────────┐
│ JwtAuthGuard: Validate JWT           │
│ - Extract user info from token       │
│ - Load full user + org from DB       │
└──────────────┬───────────────────────┘
               │ user = { userId, role, orgId, orgParentId }
               ↓
┌──────────────────────────────────────┐
│ PermissionsGuard: Check Permission   │
│ - Read @RequirePermissions decorator │
│ - Call RBACService.hasPermission()   │
└──────────────┬───────────────────────┘
               │
               ↓
          Has Permission?
           /           \
          NO           YES
          │             │
          │             ↓
          │    ┌────────────────────────┐
          │    │ TasksService.update()  │
          │    │ - Load task from DB    │
          │    │ - Load task's org      │
          │    └────────┬───────────────┘
          │             │
          │             ↓
          │    ┌────────────────────────────────────┐
          │    │ RBACService.canPerformAction()     │
          │    │ Check if user can access:          │
          │    │ - User org vs Task org             │
          │    │ - Parent/child relationship        │
          │    └────────┬───────────────────────────┘
          │             │
          │             ↓
          │        Can Access?
          │         /        \
          │        NO        YES
          │        │          │
          ↓        ↓          ↓
      ┌──────────────┐  ┌─────────────┐
      │ 403 Forbidden│  │ Update Task │
      │ + Audit Log  │  │ + Audit Log │
      └──────────────┘  └─────────────┘
```

## Organization Hierarchy Access Matrix

```
Given: 
- Parent Org (ID: 1)
- Child Org (ID: 2, parentId: 1)

┌─────────────┬──────────────┬─────────────────────────────────┐
│ User Org    │ User Role    │ Accessible Orgs                 │
├─────────────┼──────────────┼─────────────────────────────────┤
│ Parent (1)  │ OWNER        │ Parent (1), Child (2)           │
│ Parent (1)  │ ADMIN        │ Parent (1), Child (2)           │
│ Parent (1)  │ VIEWER       │ Parent (1) only                 │
│ Child (2)   │ OWNER        │ Child (2) only                  │
│ Child (2)   │ ADMIN        │ Child (2) only                  │
│ Child (2)   │ VIEWER       │ Child (2) only                  │
└─────────────┴──────────────┴─────────────────────────────────┘

Key Rules:
1. Own org is ALWAYS accessible
2. Parent org OWNER/ADMIN can access child orgs
3. Child org users CANNOT access parent org
4. VIEWER role limited to own org regardless
```

## Database Schema with Relationships

```sql
-- Organizations (self-referencing)
CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  parentId INTEGER REFERENCES organizations(id),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (references organizations)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role TEXT CHECK(role IN ('OWNER', 'ADMIN', 'VIEWER')),
  organizationId INTEGER NOT NULL REFERENCES organizations(id),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks (references organizations and users)
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK(category IN ('FEATURE', 'BUG', 'DOCUMENTATION', 'RESEARCH')),
  status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  orderIndex INTEGER DEFAULT 0,
  organizationId INTEGER NOT NULL REFERENCES organizations(id),
  createdBy INTEGER NOT NULL REFERENCES users(id),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs (references users)
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  resource VARCHAR(255) NOT NULL,
  result TEXT CHECK(result IN ('SUCCESS', 'DENIED', 'ERROR')),
  metadata TEXT
);

-- Indexes for performance
CREATE INDEX idx_tasks_org ON tasks(organizationId);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_users_org ON users(organizationId);
CREATE INDEX idx_audit_user ON audit_logs(userId);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Transport Security                             │
│ - HTTPS/TLS (production)                                │
│ - CORS whitelist                                        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                 │
│ - JWT token required for all protected routes          │
│ - Token includes: userId, role, organizationId         │
│ - 24-hour expiration                                    │
│ - bcrypt password hashing (10 rounds)                  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Authorization (RBAC)                           │
│ - Role-based permission checks                          │
│ - Organization scope validation                         │
│ - Centralized RBAC service                              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Access Control                            │
│ - Org-scoped database queries                           │
│ - TypeORM parameterized queries (SQL injection safe)   │
│ - Input validation (ValidationPipe)                     │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Audit & Monitoring                             │
│ - All access attempts logged                            │
│ - Success and denied operations tracked                 │
│ - Metadata for forensics                                │
└─────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  SHARED LIBRARIES                        │
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │   @app/data      │        │   @app/auth      │      │
│  │  - Interfaces    │        │  - RBACService   │      │
│  │  - DTOs          │        │  - Permissions   │      │
│  │  - Enums         │        │  - Role logic    │      │
│  └──────────────────┘        └──────────────────┘      │
│           ↑                           ↑                 │
└───────────┼───────────────────────────┼─────────────────┘
            │                           │
    ┌───────┴────────┐         ┌───────┴────────┐
    │                │         │                │
┌───┴────────────────┴──┐  ┌──┴────────────────┴───┐
│   BACKEND (NestJS)    │  │  FRONTEND (Angular)   │
│                       │  │                       │
│  ┌────────────────┐   │  │  ┌────────────────┐  │
│  │ AuthModule     │   │  │  │ AuthService    │  │
│  │ - Login        │   │  │  │ - Token mgmt   │  │
│  │ - JWT Strategy │   │  │  │ - User state   │  │
│  └────────────────┘   │  │  └────────────────┘  │
│                       │  │                       │
│  ┌────────────────┐   │  │  ┌────────────────┐  │
│  │ TasksModule    │   │  │  │ TaskService    │  │
│  │ - CRUD ops     │   │  │  │ - HTTP calls   │  │
│  │ - Org scoping  │   │  │  │ - State mgmt   │  │
│  └────────────────┘   │  │  └────────────────┘  │
│                       │  │                       │
│  ┌────────────────┐   │  │  ┌────────────────┐  │
│  │ AuditModule    │   │  │  │ Dashboard      │  │
│  │ - Logging      │   │  │  │ - UI           │  │
│  │ - Query logs   │   │  │  │ - Drag & Drop  │  │
│  └────────────────┘   │  │  └────────────────┘  │
│                       │  │                       │
│         ↓             │  │         ↓             │
│  ┌────────────────┐   │  │  ┌────────────────┐  │
│  │ TypeORM        │   │  │  │ HTTP Client    │  │
│  │ - Entities     │   │  │  │ - Interceptor  │  │
│  └────────────────┘   │  │  └────────────────┘  │
└───────────────────────┘  └───────────────────────┘
```

## Deployment Architecture (Production)

```
                    Internet
                       │
                       ↓
               ┌───────────────┐
               │  Load Balancer│
               └───────┬───────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
┌───────────────┐            ┌───────────────┐
│  Web Server 1 │            │  Web Server 2 │
│  - Angular    │            │  - Angular    │
│  - Nginx      │            │  - Nginx      │
└───────┬───────┘            └───────┬───────┘
        │                            │
        └──────────────┬─────────────┘
                       │
                       ↓
               ┌───────────────┐
               │  API Gateway  │
               └───────┬───────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ↓                             ↓
┌───────────────┐            ┌───────────────┐
│  API Server 1 │            │  API Server 2 │
│  - NestJS     │            │  - NestJS     │
└───────┬───────┘            └───────┬───────┘
        │                            │
        └──────────────┬─────────────┘
                       │
                       ↓
               ┌───────────────┐
               │  PostgreSQL   │
               │  - Primary    │
               │  - Replicas   │
               └───────┬───────┘
                       │
                       ↓
               ┌───────────────┐
               │  Redis Cache  │
               │  - Sessions   │
               │  - RBAC cache │
               └───────────────┘
```

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (organizationId, status, userId)
- Connection pooling for concurrent requests
- Query result caching for static data
- Read replicas for read-heavy operations

### Application Layer
- JWT stateless authentication (no session storage)
- RBAC logic cached in memory/Redis
- Lazy loading of Angular routes
- CDN for static assets

### Monitoring & Observability
- Application logs (Winston/Pino)
- Audit logs for security events
- Performance metrics (response times, error rates)
- Database query performance tracking

This architecture ensures:
- **Scalability**: Horizontal scaling of API servers
- **Security**: Multi-layered security approach
- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated components with clear interfaces
- **Performance**: Optimized data access and caching strategies
