import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionIsCancelled1731420000000 implements MigrationInterface {
    name = 'AddTransactionIsCancelled1731420000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "is_cancelled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_is_cancelled" ON "transactions" ("is_cancelled")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_is_cancelled"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "is_cancelled"`);
    }
}

