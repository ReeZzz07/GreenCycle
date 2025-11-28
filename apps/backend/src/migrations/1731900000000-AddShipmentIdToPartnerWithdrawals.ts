import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShipmentIdToPartnerWithdrawals1731900000000
  implements MigrationInterface
{
  name = 'AddShipmentIdToPartnerWithdrawals1731900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      ADD COLUMN "shipment_id" INTEGER,
      ADD CONSTRAINT "FK_partner_withdrawals_shipment_id_shipments_id"
        FOREIGN KEY ("shipment_id")
        REFERENCES "shipments"("id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_partner_withdrawals_shipment_id"
      ON "partner_withdrawals" ("shipment_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_partner_withdrawals_shipment_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "partner_withdrawals"
      DROP CONSTRAINT IF EXISTS "FK_partner_withdrawals_shipment_id_shipments_id",
      DROP COLUMN IF EXISTS "shipment_id"
    `);
  }
}

