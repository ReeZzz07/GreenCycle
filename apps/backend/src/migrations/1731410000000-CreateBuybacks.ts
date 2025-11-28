import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBuybacks1731410000000 implements MigrationInterface {
  name = 'CreateBuybacks1731410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "buyback_status_enum" AS ENUM('planned', 'contacted', 'declined', 'completed')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "buybacks" (
        "id" SERIAL PRIMARY KEY,
        "original_sale_id" INTEGER NOT NULL,
        "client_id" INTEGER NOT NULL,
        "planned_date" DATE NOT NULL,
        "actual_date" DATE,
        "status" "buyback_status_enum" NOT NULL DEFAULT 'planned',
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_buybacks_original_sale_id_sales_id"
          FOREIGN KEY ("original_sale_id")
          REFERENCES "sales"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_buybacks_client_id_clients_id"
          FOREIGN KEY ("client_id")
          REFERENCES "clients"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_buybacks_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_buybacks_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "buyback_items" (
        "id" SERIAL PRIMARY KEY,
        "buyback_id" INTEGER NOT NULL,
        "original_sale_item_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL,
        "buyback_price_per_unit" NUMERIC(14,2) NOT NULL,
        "condition_notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_buyback_items_buyback_id_buybacks_id"
          FOREIGN KEY ("buyback_id")
          REFERENCES "buybacks"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_buyback_items_original_sale_item_id_sale_items_id"
          FOREIGN KEY ("original_sale_item_id")
          REFERENCES "sale_items"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buybacks_planned_date" ON "buybacks" ("planned_date")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buybacks_status" ON "buybacks" ("status")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buybacks_client_id" ON "buybacks" ("client_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyback_items_buyback_id" ON "buyback_items" ("buyback_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyback_items_original_sale_item_id" ON "buyback_items" ("original_sale_item_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyback_items_original_sale_item_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyback_items_buyback_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buybacks_client_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buybacks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buybacks_planned_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "buyback_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "buybacks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "buyback_status_enum"`);
  }
}
