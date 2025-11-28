import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientLegalFields1763034675196 implements MigrationInterface {
    name = 'AddClientLegalFields1763034675196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" ADD "legal_entity_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "inn" character varying(12)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "kpp" character varying(9)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "ogrn" character varying(15)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "bank_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "bank_account" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "correspondent_account" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "bik" character varying(9)`);
        await queryRunner.query(`ALTER TYPE "public"."clients_client_type_enum" RENAME TO "clients_client_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."clients_client_type_enum" AS ENUM('individual', 'legal_entity', 'wholesaler')`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" TYPE "public"."clients_client_type_enum" USING "client_type"::"text"::"public"."clients_client_type_enum"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" SET DEFAULT 'individual'`);
        await queryRunner.query(`DROP TYPE "public"."clients_client_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clients_client_type_enum_old" AS ENUM('individual', 'wholesaler')`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" TYPE "public"."clients_client_type_enum_old" USING "client_type"::"text"::"public"."clients_client_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "client_type" SET DEFAULT 'individual'`);
        await queryRunner.query(`DROP TYPE "public"."clients_client_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."clients_client_type_enum_old" RENAME TO "clients_client_type_enum"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "bik"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "correspondent_account"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "bank_account"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "bank_name"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "ogrn"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "kpp"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "inn"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "legal_entity_name"`);
    }

}
