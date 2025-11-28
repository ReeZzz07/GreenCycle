import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClients1731408000000 implements MigrationInterface {
  name = 'CreateClients1731408000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "client_type_enum" AS ENUM('individual', 'wholesaler')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" SERIAL PRIMARY KEY,
        "full_name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20),
        "email" VARCHAR(255),
        "address_full" TEXT NOT NULL,
        "client_type" "client_type_enum" NOT NULL DEFAULT 'individual',
        "first_purchase_date" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_clients_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_clients_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_clients_phone" ON "clients" ("phone") WHERE "phone" IS NOT NULL`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_clients_email" ON "clients" ("email") WHERE "email" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_phone"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "client_type_enum"`);
  }
}
