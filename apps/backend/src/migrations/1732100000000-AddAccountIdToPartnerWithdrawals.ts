import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountIdToPartnerWithdrawals1732100000000
  implements MigrationInterface
{
  name = 'AddAccountIdToPartnerWithdrawals1732100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      ADD COLUMN "account_id" INTEGER,
      ADD CONSTRAINT "FK_partner_withdrawals_account_id_accounts_id"
        FOREIGN KEY ("account_id")
        REFERENCES "accounts"("id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_partner_withdrawals_account_id"
      ON "partner_withdrawals" ("account_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_withdrawals_account_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      DROP CONSTRAINT IF EXISTS "FK_partner_withdrawals_account_id_accounts_id",
      DROP COLUMN IF EXISTS "account_id"
    `);
  }
}

