import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { AuditAction, AuditResult } from '@app/data';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  action: AuditAction;

  @Column()
  resource: string;

  @Column({ type: 'text' })
  result: AuditResult;

  @Column({ type: 'text', nullable: true })
  metadata: string | null;
}
