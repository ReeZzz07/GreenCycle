import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config({
  path: process.env.ENV_FILE ?? `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`
});

// Для TypeORM CLI используем абсолютные пути
const rootDir = process.cwd();
const srcDir = join(rootDir, 'src');

const entitiesPath = join(srcDir, '**', '*.entity.{ts,js}');
const migrationsPath = join(srcDir, 'migrations', '*{.ts,.js}');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'greencycle',
  password: process.env.DB_PASSWORD ?? 'greencycle',
  database: process.env.DB_NAME ?? 'greencycle',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: (process.env.DB_LOGGING ?? 'false').toLowerCase() === 'true',
  ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true'
});

export default dataSource;

