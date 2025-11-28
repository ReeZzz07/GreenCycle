import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateAccountIdForExistingCashWithdrawals1732110000000
  implements MigrationInterface
{
  name = 'PopulateAccountIdForExistingCashWithdrawals1732110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Обновляем account_id для существующих изъятий типа cash через связанные транзакции
    await queryRunner.query(`
      UPDATE "partner_withdrawals" pw
      SET "account_id" = t."account_id"
      FROM "transactions" t
      WHERE pw."type" = 'cash'
        AND t."linked_entity_type" = 'partner_withdrawal'
        AND t."linked_entity_id" = pw."id"
        AND pw."account_id" IS NULL
        AND t."account_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Не нужно ничего делать при откате, так как это миграция данных
  }
}

