# API Testing Guide

This guide provides comprehensive examples for testing the API using curl commands.

## Setup

1. Start the backend server:
   ```bash
   cd apps/api
   npm run start:dev
   ```

2. The API will be available at: `http://localhost:3000`

## Authentication Examples

### Login as Owner
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@parent.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "owner@parent.com",
    "role": "OWNER",
    "organizationId": 1
  }
}
```

Save the `accessToken` for subsequent requests.

### Login as Admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@parent.com",
    "password": "password123"
  }'
```

### Login as Viewer
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@child.com",
    "password": "password123"
  }'
```

## Task Management Examples

**Note:** Replace `YOUR_TOKEN_HERE` with the actual token from login response.

### Get All Tasks (Viewer)
```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Only tasks from child organization (org ID 2)

### Get All Tasks (Owner/Admin)
```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Tasks from parent org AND child org

### Create Task (Owner/Admin)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Feature Task",
    "description": "Implement new feature with RBAC",
    "category": "FEATURE",
    "status": "TODO"
  }'
```

**Response:**
```json
{
  "id": 6,
  "title": "New Feature Task",
  "description": "Implement new feature with RBAC",
  "category": "FEATURE",
  "status": "TODO",
  "orderIndex": 0,
  "organizationId": 1,
  "createdBy": 1,
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Create Task (Viewer - Should Fail)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer VIEWER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "This should fail",
    "description": "Viewer cannot create",
    "category": "FEATURE",
    "status": "TODO"
  }'
```

**Expected Response: 403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### Update Task
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Task Title",
    "status": "IN_PROGRESS"
  }'
```

### Delete Task
```bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

## Audit Log Examples

### Get Audit Logs (Owner/Admin)
```bash
curl -X GET http://localhost:3000/audit-log \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "userId": 1,
    "action": "TASK_CREATE",
    "resource": "task:1",
    "result": "SUCCESS",
    "metadata": "{\"title\":\"New Task\"}"
  },
  {
    "id": 2,
    "timestamp": "2024-01-01T12:05:00.000Z",
    "userId": 3,
    "action": "TASK_CREATE",
    "resource": "task",
    "result": "DENIED",
    "metadata": "{\"reason\":\"Insufficient permissions\"}"
  }
]
```

### Get Audit Logs (Viewer - Should Fail)
```bash
curl -X GET http://localhost:3000/audit-log \
  -H "Authorization: Bearer VIEWER_TOKEN_HERE"
```

**Expected Response: 403 Forbidden**

## RBAC Testing Scenarios

### Scenario 1: Viewer Restrictions

1. Login as viewer
2. Try to create a task (should fail with 403)
3. Try to update a task (should fail with 403)
4. Try to delete a task (should fail with 403)
5. Try to access audit logs (should fail with 403)
6. Get tasks (should only see child org tasks)

### Scenario 2: Admin Capabilities

1. Login as admin
2. Create a task (should succeed)
3. Update a task (should succeed)
4. Delete a task (should succeed)
5. Access audit logs (should succeed)
6. Get tasks (should see parent + child org tasks)

### Scenario 3: Organization Scoping

1. Login as admin (parent org)
2. Get all tasks
3. Verify you can see both parent and child org tasks

4. Login as viewer (child org)
5. Get all tasks
6. Verify you can ONLY see child org tasks (not parent)

### Scenario 4: Cross-Org Access Prevention

1. Login as viewer (child org, org ID 2)
2. Try to update a task from parent org (org ID 1)
3. Should fail with 403 even if you have the task ID

## Error Scenarios

### Missing Authentication Token
```bash
curl -X GET http://localhost:3000/tasks
```

**Response: 401 Unauthorized**

### Invalid Token
```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer invalid_token_here"
```

**Response: 401 Unauthorized**

### Invalid Credentials
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wrong@email.com",
    "password": "wrongpassword"
  }'
```

**Response: 401 Unauthorized**

## Testing with Postman

### Import Collection

Create a new Postman collection with these requests:

1. **Auth - Login Owner**
   - Method: POST
   - URL: `http://localhost:3000/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "owner@parent.com",
       "password": "password123"
     }
     ```

2. **Tasks - Get All**
   - Method: GET
   - URL: `http://localhost:3000/tasks`
   - Headers:
     - `Authorization: Bearer {{token}}`

3. **Tasks - Create**
   - Method: POST
   - URL: `http://localhost:3000/tasks`
   - Headers:
     - `Authorization: Bearer {{token}}`
   - Body (JSON):
     ```json
     {
       "title": "Test Task",
       "description": "Testing via Postman",
       "category": "FEATURE",
       "status": "TODO"
     }
     ```

### Environment Variables

Create a Postman environment with:
- `baseUrl`: `http://localhost:3000`
- `token`: (set this after login)

## Verification Checklist

✅ Authentication
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Requests without token fail with 401

✅ Viewer Role
- [ ] Can read tasks (only child org)
- [ ] Cannot create tasks (403)
- [ ] Cannot update tasks (403)
- [ ] Cannot delete tasks (403)
- [ ] Cannot access audit logs (403)

✅ Admin Role
- [ ] Can read tasks (parent + child org)
- [ ] Can create tasks
- [ ] Can update tasks
- [ ] Can delete tasks
- [ ] Can access audit logs

✅ Owner Role
- [ ] Full access to all operations
- [ ] Can see all organizations

✅ Audit Logging
- [ ] Successful operations logged
- [ ] Failed operations logged
- [ ] Logs contain proper metadata

✅ Organization Scoping
- [ ] Child org user only sees child org tasks
- [ ] Parent org admin sees parent + child tasks
- [ ] Cross-org modification prevented
