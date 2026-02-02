import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { OrganizationEntity } from './organization.entity';
import { TaskEntity } from './task.entity';
import { UserRole, TaskCategory, TaskStatus } from '@app/data';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('Seeding database...');

  const userRepository = dataSource.getRepository(UserEntity);
  const orgRepository = dataSource.getRepository(OrganizationEntity);
  const taskRepository = dataSource.getRepository(TaskEntity);

  // Create organizations
  const parentOrg = orgRepository.create({
    name: 'Parent Corporation',
    parentId: null,
  });
  await orgRepository.save(parentOrg);

  const childOrg = orgRepository.create({
    name: 'Child Division',
    parentId: parentOrg.id,
  });
  await orgRepository.save(childOrg);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = userRepository.create({
    email: 'owner@parent.com',
    passwordHash: hashedPassword,
    role: UserRole.OWNER,
    organizationId: parentOrg.id,
  });
  await userRepository.save(owner);

  const admin = userRepository.create({
    email: 'admin@parent.com',
    passwordHash: hashedPassword,
    role: UserRole.ADMIN,
    organizationId: parentOrg.id,
  });
  await userRepository.save(admin);

  const viewer = userRepository.create({
    email: 'viewer@child.com',
    passwordHash: hashedPassword,
    role: UserRole.VIEWER,
    organizationId: childOrg.id,
  });
  await userRepository.save(viewer);

  // Create sample tasks in parent org
  const parentTasks = [
    {
      title: 'Implement authentication system',
      description: 'Build JWT-based authentication with RBAC',
      category: TaskCategory.FEATURE,
      status: TaskStatus.IN_PROGRESS,
      orderIndex: 0,
      organizationId: parentOrg.id,
      createdBy: owner.id,
    },
    {
      title: 'Fix login bug',
      description: 'Users unable to login with special characters in password',
      category: TaskCategory.BUG,
      status: TaskStatus.TODO,
      orderIndex: 1,
      organizationId: parentOrg.id,
      createdBy: admin.id,
    },
    {
      title: 'API documentation',
      description: 'Document all REST endpoints with examples',
      category: TaskCategory.DOCUMENTATION,
      status: TaskStatus.DONE,
      orderIndex: 2,
      organizationId: parentOrg.id,
      createdBy: owner.id,
    },
  ];

  for (const taskData of parentTasks) {
    const task = taskRepository.create(taskData);
    await taskRepository.save(task);
  }

  // Create sample tasks in child org
  const childTasks = [
    {
      title: 'Research new frameworks',
      description: 'Evaluate Angular vs React for new project',
      category: TaskCategory.RESEARCH,
      status: TaskStatus.IN_PROGRESS,
      orderIndex: 0,
      organizationId: childOrg.id,
      createdBy: viewer.id,
    },
    {
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      category: TaskCategory.FEATURE,
      status: TaskStatus.TODO,
      orderIndex: 1,
      organizationId: childOrg.id,
      createdBy: viewer.id,
    },
  ];

  for (const taskData of childTasks) {
    const task = taskRepository.create(taskData);
    await taskRepository.save(task);
  }

  console.log('Database seeded successfully!');
  console.log('\nTest Credentials:');
  console.log('Owner: owner@parent.com / password123');
  console.log('Admin: admin@parent.com / password123');
  console.log('Viewer: viewer@child.com / password123');
}
