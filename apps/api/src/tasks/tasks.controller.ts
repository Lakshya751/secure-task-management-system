import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { CreateTaskDto, UpdateTaskDto, Permission } from '@app/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  async findAll(@CurrentUser() user: any) {
    return this.tasksService.findAll(user);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted successfully' };
  }
}
