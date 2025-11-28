import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class InitRolesAndUsers1731400000000 implements MigrationInterface {
  name = 'InitRolesAndUsers1731400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext";`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "email" CITEXT NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(255) NOT NULL,
        "role_id" INTEGER NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by_id" INTEGER,
        "updated_by_id" INTEGER,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "FK_users_role_id_roles_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id")
      )
    `);

    const roles = ['super_admin', 'admin', 'manager', 'accountant', 'logistic'] as const;

    for (const role of roles) {
      await queryRunner.query(
        `
          INSERT INTO "roles" ("name")
          VALUES ($1)
          ON CONFLICT ("name") DO NOTHING
        `,
        [role]
      );
    }

    const superAdminResult = (await queryRunner.query(
      `SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1`
    )) as Array<{ id: number }>;
    const superAdmin = superAdminResult[0];

    if (superAdmin?.id !== undefined) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
      const passwordHash = await bcrypt.hash('GreenCycle#2025', saltRounds);

      await queryRunner.query(
        `
          INSERT INTO "users" ("email", "password_hash", "full_name", "role_id")
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ("email") DO NOTHING
        `,
        ['founder@greencycle.local', passwordHash, 'Founding Admin', Number(superAdmin.id)]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE email = 'founder@greencycle.local';`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);
  }
}

