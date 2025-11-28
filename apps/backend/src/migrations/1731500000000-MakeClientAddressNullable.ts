import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeClientAddressNullable1731500000000 implements MigrationInterface {
  name = 'MakeClientAddressNullable1731500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients" 
      ALTER COLUMN "address_full" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Устанавливаем значение по умолчанию для существующих NULL записей
    await queryRunner.query(`
      UPDATE "clients" 
      SET "address_full" = 'Не указан' 
      WHERE "address_full" IS NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "clients" 
      ALTER COLUMN "address_full" SET NOT NULL
    `);
  }
}

