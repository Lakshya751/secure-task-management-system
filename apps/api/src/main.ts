import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedDatabase } from './database/seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Get data source and seed database if empty
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository('UserEntity');
  const userCount = await userRepository.count();

  if (userCount === 0) {
    console.log('Database is empty, seeding...');
    await seedDatabase(dataSource);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 API server running on http://localhost:${port}`);
  console.log(`📚 Test the API at http://localhost:${port}/tasks\n`);
}

bootstrap();
