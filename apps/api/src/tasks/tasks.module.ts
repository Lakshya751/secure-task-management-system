import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskEntity } from '../database/task.entity';
import { OrganizationEntity } from '../database/organization.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, OrganizationEntity]),
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
