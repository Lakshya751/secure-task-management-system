import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TaskEntity } from '../database/task.entity';
import { OrganizationEntity } from '../database/organization.entity';
import { CreateTaskDto, UpdateTaskDto, Permission, AuditAction, AuditResult } from '@app/data';
import { RBACService } from '@app/auth';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    @InjectRepository(OrganizationEntity)
    private orgRepository: Repository<OrganizationEntity>,
    private auditService: AuditService,
  ) {}

  /**
   * Get accessible organization IDs for user based on RBAC
   */
  private async getAccessibleOrgIds(
    userOrgId: number,
    userRole: string,
  ): Promise<number[]> {
    const userOrg = await this.orgRepository.findOne({
      where: { id: userOrgId },
    });

    if (!userOrg) {
      return [userOrgId];
    }

    const accessibleOrgIds = [userOrgId];

    // Owner and Admin can access child orgs
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      const childOrgs = await this.orgRepository.find({
        where: { parentId: userOrgId },
      });
      accessibleOrgIds.push(...childOrgs.map((org) => org.id));
    }

    return accessibleOrgIds;
  }

  async create(createTaskDto: CreateTaskDto, user: any): Promise<TaskEntity> {
    try {
      // Verify user has create permission
      if (!RBACService.hasPermission(user.role, Permission.TASK_CREATE)) {
        await this.auditService.log(
          user.userId,
          AuditAction.TASK_CREATE,
          'task',
          AuditResult.DENIED,
          { reason: 'Insufficient permissions' },
        );
        throw new ForbiddenException('Insufficient permissions to create task');
      }

      const task = this.taskRepository.create({
        ...createTaskDto,
        organizationId: user.organizationId,
        createdBy: user.userId,
        orderIndex: createTaskDto.orderIndex ?? 0,
      });

      const savedTask = await this.taskRepository.save(task);

      await this.auditService.log(
        user.userId,
        AuditAction.TASK_CREATE,
        `task:${savedTask.id}`,
        AuditResult.SUCCESS,
        { title: savedTask.title },
      );

      return savedTask;
    } catch (error) {
      await this.auditService.log(
        user.userId,
        AuditAction.TASK_CREATE,
        'task',
        AuditResult.ERROR,
        { error: error.message },
      );
      throw error;
    }
  }

  async findAll(user: any): Promise<TaskEntity[]> {
    try {
      // Get accessible org IDs based on user role and org hierarchy
      const accessibleOrgIds = await this.getAccessibleOrgIds(
        user.organizationId,
        user.role,
      );

      const tasks = await this.taskRepository.find({
        where: { organizationId: In(accessibleOrgIds) },
        order: { orderIndex: 'ASC', createdAt: 'DESC' },
      });

      await this.auditService.log(
        user.userId,
        AuditAction.TASK_READ,
        'tasks',
        AuditResult.SUCCESS,
        { count: tasks.length },
      );

      return tasks;
    } catch (error) {
      await this.auditService.log(
        user.userId,
        AuditAction.TASK_READ,
        'tasks',
        AuditResult.ERROR,
        { error: error.message },
      );
      throw error;
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any): Promise<TaskEntity> {
    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['organization'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if user can access this task's organization
      const taskOrg = await this.orgRepository.findOne({
        where: { id: task.organizationId },
      });

      const canAccess = RBACService.canPerformAction(
        user.role,
        Permission.TASK_UPDATE,
        user.organizationId,
        user.organizationParentId,
        task.organizationId,
        taskOrg?.parentId || null,
      );

      if (!canAccess) {
        await this.auditService.log(
          user.userId,
          AuditAction.TASK_UPDATE,
          `task:${id}`,
          AuditResult.DENIED,
          { reason: 'Insufficient permissions or out of scope' },
        );
        throw new ForbiddenException('Cannot update task outside your organization scope');
      }

      Object.assign(task, updateTaskDto);
      const updatedTask = await this.taskRepository.save(task);

      await this.auditService.log(
        user.userId,
        AuditAction.TASK_UPDATE,
        `task:${id}`,
        AuditResult.SUCCESS,
        { changes: updateTaskDto },
      );

      return updatedTask;
    } catch (error) {
      await this.auditService.log(
        user.userId,
        AuditAction.TASK_UPDATE,
        `task:${id}`,
        AuditResult.ERROR,
        { error: error.message },
      );
      throw error;
    }
  }

  async remove(id: number, user: any): Promise<void> {
    try {
      const task = await this.taskRepository.findOne({
        where: { id },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if user can access this task's organization
      const taskOrg = await this.orgRepository.findOne({
        where: { id: task.organizationId },
      });

      const canAccess = RBACService.canPerformAction(
        user.role,
        Permission.TASK_DELETE,
        user.organizationId,
        user.organizationParentId,
        task.organizationId,
        taskOrg?.parentId || null,
      );

      if (!canAccess) {
        await this.auditService.log(
          user.userId,
          AuditAction.TASK_DELETE,
          `task:${id}`,
          AuditResult.DENIED,
          { reason: 'Insufficient permissions or out of scope' },
        );
        throw new ForbiddenException('Cannot delete task outside your organization scope');
      }

      await this.taskRepository.remove(task);

      await this.auditService.log(
        user.userId,
        AuditAction.TASK_DELETE,
        `task:${id}`,
        AuditResult.SUCCESS,
      );
    } catch (error) {
      await this.auditService.log(
        user.userId,
        AuditAction.TASK_DELETE,
        `task:${id}`,
        AuditResult.ERROR,
        { error: error.message },
      );
      throw error;
    }
  }
}
