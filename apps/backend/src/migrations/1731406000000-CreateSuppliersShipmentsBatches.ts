import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuppliersShipmentsBatches1731406000000 implements MigrationInterface {
  name = 'CreateSuppliersShipmentsBatches1731406000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(150) NOT NULL,
        "contact_info" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "UQ_suppliers_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipments" (
        "id" SERIAL PRIMARY KEY,
        "supplier_id" INTEGER NOT NULL,
        "arrival_date" DATE NOT NULL,
        "total_cost" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "document_url" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_shipments_supplier_id_suppliers_id"
          FOREIGN KEY ("supplier_id")
          REFERENCES "suppliers"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "batches" (
        "id" SERIAL PRIMARY KEY,
        "shipment_id" INTEGER NOT NULL,
        "plant_type" VARCHAR(150) NOT NULL,
        "size_cm_min" INTEGER NOT NULL,
        "size_cm_max" INTEGER NOT NULL,
        "pot_type" VARCHAR(50) NOT NULL,
        "quantity_initial" INTEGER NOT NULL,
        "quantity_current" INTEGER NOT NULL,
        "purchase_price_per_unit" NUMERIC(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_batches_shipment_id_shipments_id"
          FOREIGN KEY ("shipment_id")
          REFERENCES "shipments"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_batches_shipment_id" ON "batches" ("shipment_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shipments_supplier_arrival" ON "shipments" ("supplier_id", "arrival_date")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shipments_supplier_arrival"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_batches_shipment_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "batches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shipments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}

