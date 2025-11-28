import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserNotificationSettings1731600000000 implements MigrationInterface {
  name = 'CreateUserNotificationSettings1731600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_notification_settings" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL UNIQUE,
        "email_enabled" BOOLEAN NOT NULL DEFAULT true,
        "buyback_reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
        "buyback_reminder_60_days" BOOLEAN NOT NULL DEFAULT true,
        "buyback_reminder_30_days" BOOLEAN NOT NULL DEFAULT true,
        "buyback_reminder_7_days" BOOLEAN NOT NULL DEFAULT true,
        "sales_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
        "shipment_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
        "finance_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_notification_settings_user_id_users_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    // Создаем настройки по умолчанию для всех существующих пользователей
    await queryRunner.query(`
      INSERT INTO "user_notification_settings" ("user_id")
      SELECT "id" FROM "users"
      ON CONFLICT ("user_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notification_settings"`);
  }
}

