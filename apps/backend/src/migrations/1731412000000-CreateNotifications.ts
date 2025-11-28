import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1731412000000 implements MigrationInterface {
  name = 'CreateNotifications1731412000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "client_id" INTEGER,
        "buyback_id" INTEGER,
        "message" TEXT NOT NULL,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "due_date" DATE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_notifications_user_id_users_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_client_id_clients_id"
          FOREIGN KEY ("client_id")
          REFERENCES "clients"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_notifications_buyback_id_buybacks_id"
          FOREIGN KEY ("buyback_id")
          REFERENCES "buybacks"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("user_id", "is_read")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_buyback" ON "notifications" ("buyback_id") WHERE "buyback_id" IS NOT NULL`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_read" ON "notifications" ("is_read")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_due_date" ON "notifications" ("due_date") WHERE "due_date" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_due_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_buyback"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
