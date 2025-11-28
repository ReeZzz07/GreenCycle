import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShipmentInvestments1732000000000
  implements MigrationInterface
{
  name = 'CreateShipmentInvestments1732000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shipment_investments" (
        "id" SERIAL NOT NULL,
        "shipment_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
        "amount" NUMERIC(14,2) NOT NULL,
        "percentage" NUMERIC(5,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "PK_shipment_investments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shipment_investments_shipment" 
      ON "shipment_investments" ("shipment_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_shipment_investments_user" 
      ON "shipment_investments" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      ADD CONSTRAINT "FK_shipment_investments_shipment_id_shipments_id"
      FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      ADD CONSTRAINT "FK_shipment_investments_user_id_users_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      ADD CONSTRAINT "FK_shipment_investments_created_by_id_users_id"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      ADD CONSTRAINT "FK_shipment_investments_updated_by_id_users_id"
      FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      DROP CONSTRAINT "FK_shipment_investments_updated_by_id_users_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      DROP CONSTRAINT "FK_shipment_investments_created_by_id_users_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      DROP CONSTRAINT "FK_shipment_investments_user_id_users_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "shipment_investments"
      DROP CONSTRAINT "FK_shipment_investments_shipment_id_shipments_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_shipment_investments_user"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_shipment_investments_shipment"
    `);

    await queryRunner.query(`
      DROP TABLE "shipment_investments"
    `);
  }
}

