import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../database/audit-log.entity';
import { AuditAction, AuditResult } from '@app/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private auditRepository: Repository<AuditLogEntity>,
  ) {}

  async log(
    userId: number,
    action: AuditAction,
    resource: string,
    result: AuditResult,
    metadata?: any,
  ): Promise<void> {
    const auditLog = this.auditRepository.create({
      userId,
      action,
      resource,
      result,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    await this.auditRepository.save(auditLog);

    // Also log to console for immediate visibility
    console.log(
      `[AUDIT] User ${userId} | ${action} | ${resource} | ${result}`,
      metadata ? `| ${JSON.stringify(metadata)}` : '',
    );
  }

  async findAll(userId: number, userRole: string, userOrgId: number): Promise<AuditLogEntity[]> {
    // For now, return all logs visible to the user
    // In production, you might want to add pagination
    return this.auditRepository.find({
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }
}
