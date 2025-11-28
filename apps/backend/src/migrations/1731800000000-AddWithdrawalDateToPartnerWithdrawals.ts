import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWithdrawalDateToPartnerWithdrawals1731800000000
  implements MigrationInterface
{
  name = 'AddWithdrawalDateToPartnerWithdrawals1731800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      ADD COLUMN IF NOT EXISTS "withdrawal_date" DATE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      DROP COLUMN IF EXISTS "withdrawal_date"
    `);
  }
}

