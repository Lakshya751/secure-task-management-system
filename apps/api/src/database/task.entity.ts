import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskCategory, TaskStatus } from '@app/data';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'text' })
  category: TaskCategory;

  @Column({ type: 'text' })
  status: TaskStatus;

  @Column({ default: 0 })
  orderIndex: number;

  @Column()
  organizationId: number;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @Column()
  createdBy: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
