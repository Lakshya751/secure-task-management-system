import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedDatabase } from '../database/seeder';

describe('RBAC Integration Tests', () => {
  let app: INestApplication;
  let ownerToken: string;
  let adminToken: string;
  let viewerToken: string;
  let parentOrgTaskId: number;
  let childOrgTaskId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Seed database
    const dataSource = app.get(DataSource);
    await seedDatabase(dataSource);

    // Get auth tokens for each role
    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@parent.com', password: 'password123' });
    ownerToken = ownerLogin.body.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@parent.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    const viewerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'viewer@child.com', password: 'password123' });
    viewerToken = viewerLogin.body.accessToken;

    // Get task IDs from seeded data
    const ownerTasks = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${ownerToken}`);
    
    parentOrgTaskId = ownerTasks.body.find((t: any) => t.organizationId === 1)?.id;
    childOrgTaskId = ownerTasks.body.find((t: any) => t.organizationId === 2)?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@parent.com', password: 'password123' })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('owner@parent.com');
      expect(response.body.user.role).toBe('OWNER');
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'owner@parent.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject requests without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });
  });

  describe('Viewer Role Permissions', () => {
    it('should allow viewer to read tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should prevent viewer from creating tasks', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Task',
          description: 'Should fail',
          category: 'FEATURE',
          status: 'TODO',
        })
        .expect(403);
    });

    it('should prevent viewer from updating tasks', async () => {
      await request(app.getHttpServer())
        .put(`/tasks/${childOrgTaskId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);
    });

    it('should prevent viewer from deleting tasks', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${childOrgTaskId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should prevent viewer from accessing audit logs', async () => {
      await request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });

  describe('Admin Role Permissions', () => {
    it('should allow admin to create tasks', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Task',
          description: 'Created by admin',
          category: 'FEATURE',
          status: 'TODO',
        })
        .expect(201);

      expect(response.body.title).toBe('Admin Task');
      expect(response.body.organizationId).toBe(1); // Parent org
    });

    it('should allow admin to update tasks in own org', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/${parentOrgTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated by Admin' })
        .expect(200);

      expect(response.body.title).toBe('Updated by Admin');
    });

    it('should allow admin to delete tasks', async () => {
      // Create a task first
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'To Delete',
          description: 'Will be deleted',
          category: 'BUG',
          status: 'TODO',
        });

      const taskId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow admin to access audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow admin to access child org tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const hasParentOrgTasks = response.body.some((t: any) => t.organizationId === 1);
      const hasChildOrgTasks = response.body.some((t: any) => t.organizationId === 2);

      expect(hasParentOrgTasks).toBe(true);
      expect(hasChildOrgTasks).toBe(true);
    });
  });

  describe('Owner Role Permissions', () => {
    it('should allow owner full access', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Owner Task',
          description: 'Created by owner',
          category: 'FEATURE',
          status: 'TODO',
        })
        .expect(201);

      expect(response.body.title).toBe('Owner Task');
    });

    it('should allow owner to access all org tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const hasParentOrgTasks = response.body.some((t: any) => t.organizationId === 1);
      const hasChildOrgTasks = response.body.some((t: any) => t.organizationId === 2);

      expect(hasParentOrgTasks).toBe(true);
      expect(hasChildOrgTasks).toBe(true);
    });
  });

  describe('Organization Scoping', () => {
    it('should only show viewer their own org tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      // Viewer in child org should only see child org tasks
      const allTasksInChildOrg = response.body.every((t: any) => t.organizationId === 2);
      expect(allTasksInChildOrg).toBe(true);
    });

    it('should prevent child org user from accessing parent org tasks', async () => {
      // Viewer is in child org, trying to access parent org task should fail
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      const hasParentOrgTasks = response.body.some((t: any) => t.organizationId === 1);
      expect(hasParentOrgTasks).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log successful task creation', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Audit Test Task',
          description: 'For audit logging',
          category: 'FEATURE',
          status: 'TODO',
        })
        .expect(201);

      const auditLogs = await request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const createLog = auditLogs.body.find(
        (log: any) => log.action === 'TASK_CREATE' && log.result === 'SUCCESS',
      );
      expect(createLog).toBeDefined();
    });

    it('should log denied access attempts', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Should Fail',
          description: 'Viewer cannot create',
          category: 'FEATURE',
          status: 'TODO',
        })
        .expect(403);

      const auditLogs = await request(app.getHttpServer())
        .get('/audit-log')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const deniedLog = auditLogs.body.find(
        (log: any) => log.action === 'TASK_CREATE' && log.result === 'DENIED',
      );
      expect(deniedLog).toBeDefined();
    });
  });
});
