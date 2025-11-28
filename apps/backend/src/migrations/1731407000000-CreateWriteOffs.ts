import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWriteOffs1731407000000 implements MigrationInterface {
  name = 'CreateWriteOffs1731407000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "write_offs" (
        "id" SERIAL PRIMARY KEY,
        "batch_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL,
        "reason" VARCHAR(120) NOT NULL,
        "write_off_date" DATE NOT NULL,
        "total_cost" NUMERIC(14,2) NOT NULL,
        "comment" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "FK_write_offs_batch_id_batches_id"
          FOREIGN KEY ("batch_id")
          REFERENCES "batches"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_write_offs_batch_date" ON "write_offs" ("batch_id", "write_off_date")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_write_offs_batch_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "write_offs"`);
  }
}


