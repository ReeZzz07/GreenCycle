import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1731409000000 implements MigrationInterface {
  name = 'CreateSales1731409000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "sale_status_enum" AS ENUM('completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" SERIAL PRIMARY KEY,
        "client_id" INTEGER NOT NULL,
        "sale_date" DATE NOT NULL,
        "total_amount" NUMERIC(14,2) NOT NULL,
        "status" "sale_status_enum" NOT NULL DEFAULT 'completed',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_sales_client_id_clients_id"
          FOREIGN KEY ("client_id")
          REFERENCES "clients"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_sales_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_sales_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" SERIAL PRIMARY KEY,
        "sale_id" INTEGER NOT NULL,
        "batch_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL,
        "sale_price_per_unit" NUMERIC(14,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sale_items_sale_id_sales_id"
          FOREIGN KEY ("sale_id")
          REFERENCES "sales"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_sale_items_batch_id_batches_id"
          FOREIGN KEY ("batch_id")
          REFERENCES "batches"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_date" ON "sales" ("sale_date")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_client_id" ON "sales" ("client_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sale_items_sale_id" ON "sale_items" ("sale_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sale_items_batch_id" ON "sale_items" ("batch_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_batch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sale_items_sale_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_client_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sale_status_enum"`);
  }
}
