import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { UserEntity } from './database/user.entity';
import { OrganizationEntity } from './database/organization.entity';
import { TaskEntity } from './database/task.entity';
import { AuditLogEntity } from './database/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [UserEntity, OrganizationEntity, TaskEntity, AuditLogEntity],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    TasksModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
