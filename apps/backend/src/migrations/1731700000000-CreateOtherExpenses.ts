import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOtherExpenses1731700000000 implements MigrationInterface {
  name = 'CreateOtherExpenses1731700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "other_expenses" (
        "id" SERIAL PRIMARY KEY,
        "account_id" INTEGER NOT NULL,
        "amount" NUMERIC(14,2) NOT NULL,
        "category" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "expense_date" DATE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_other_expenses_account_id_accounts_id"
          FOREIGN KEY ("account_id")
          REFERENCES "accounts"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_other_expenses_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_other_expenses_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_other_expenses_account_date" ON "other_expenses" ("account_id", "expense_date")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_other_expenses_category" ON "other_expenses" ("category")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_other_expenses_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_other_expenses_account_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "other_expenses"`);
  }
}

