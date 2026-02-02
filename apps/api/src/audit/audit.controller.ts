import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { Permission, AuditAction, AuditResult } from '@app/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions(Permission.AUDIT_READ)
  async getAuditLogs(@CurrentUser() user: any) {
    // Log this audit read access
    await this.auditService.log(
      user.userId,
      AuditAction.AUDIT_READ,
      'audit-log',
      AuditResult.SUCCESS,
    );

    return this.auditService.findAll(user.userId, user.role, user.organizationId);
  }
}
