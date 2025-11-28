import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

config();

// Используем DataSource без entities, только для raw SQL запросов
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'greencycle',
  password: process.env.DB_PASSWORD ?? 'greencycle',
  database: process.env.DB_NAME ?? 'greencycle',
  entities: [], // Не загружаем entities, используем только raw SQL
  synchronize: false,
  logging: false,
});

async function checkUser() {
  await dataSource.initialize();

  try {
    // Используем raw SQL для проверки пользователя
    const userResult = await dataSource.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE LOWER(u.email) = LOWER($1)`,
      ['founder@greencycle.local']
    );

    if (!userResult || userResult.length === 0) {
      console.log('❌ Пользователь не найден в базе данных!');
      console.log('Создаю пользователя...');

      const roleResult = await dataSource.query(
        `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
        ['super_admin']
      );

      if (!roleResult || roleResult.length === 0) {
        console.log('❌ Роль super_admin не найдена!');
        return;
      }

      const superAdminRoleId = roleResult[0].id;
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
      const passwordHash = await bcrypt.hash('GreenCycle#2025', saltRounds);

      await dataSource.query(
        `INSERT INTO users (email, password_hash, full_name, role_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        ['founder@greencycle.local', passwordHash, 'Founding Admin', superAdminRoleId]
      );

      console.log('✅ Пользователь создан!');
    } else {
      const user = userResult[0];
      console.log('✅ Пользователь найден:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Имя: ${user.full_name}`);
      console.log(`   Роль: ${user.role_name || 'не указана'}`);

      // Проверяем пароль
      const testPassword = 'GreenCycle#2025';
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`   Проверка пароля: ${isValid ? '✅ Валиден' : '❌ Невалиден'}`);

      if (!isValid) {
        console.log('⚠️  Пароль не совпадает! Пересоздаю хеш...');
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
        const newPasswordHash = await bcrypt.hash(testPassword, saltRounds);
        await dataSource.query(
          `UPDATE users SET password_hash = $1 WHERE id = $2`,
          [newPasswordHash, user.id]
        );
        console.log('✅ Пароль обновлен!');
      }
    }
  } finally {
    await dataSource.destroy();
  }
}

checkUser().catch((error) => {
  console.error('Ошибка:', error);
  process.exit(1);
});

