import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFinance1731411000000 implements MigrationInterface {
  name = 'CreateFinance1731411000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "account_type_enum" AS ENUM('cash', 'bank', 'other')
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM('purchase', 'sale', 'buyback', 'write_off', 'partner_withdrawal')
    `);

    await queryRunner.query(`
      CREATE TYPE "linked_entity_type_enum" AS ENUM('shipment', 'sale', 'buyback', 'write_off', 'partner_withdrawal')
    `);

    await queryRunner.query(`
      CREATE TYPE "partner_withdrawal_type_enum" AS ENUM('cash', 'goods')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accounts" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "type" "account_type_enum" NOT NULL,
        "balance" NUMERIC(14,2) NOT NULL DEFAULT '0.00',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" SERIAL PRIMARY KEY,
        "account_id" INTEGER NOT NULL,
        "amount" NUMERIC(14,2) NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "description" TEXT,
        "linked_entity_id" INTEGER,
        "linked_entity_type" "linked_entity_type_enum",
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_transactions_account_id_accounts_id"
          FOREIGN KEY ("account_id")
          REFERENCES "accounts"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_transactions_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partner_withdrawals" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "type" "partner_withdrawal_type_enum" NOT NULL,
        "amount_or_quantity" NUMERIC(14,2) NOT NULL,
        "cost_value" NUMERIC(14,2),
        "reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_partner_withdrawals_user_id_users_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_partner_withdrawals_created_by_id_users_id"
          FOREIGN KEY ("created_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_partner_withdrawals_updated_by_id_users_id"
          FOREIGN KEY ("updated_by_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_account_date" ON "transactions" ("account_id", "created_at")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_type" ON "transactions" ("type")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_linked_entity" ON "transactions" ("linked_entity_type", "linked_entity_id")`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_partner_withdrawals_user_date" ON "partner_withdrawals" ("user_id", "created_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partner_withdrawals_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_linked_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_account_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partner_withdrawals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "partner_withdrawal_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "linked_entity_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "account_type_enum"`);
  }
}
