import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USER: Joi.string().default('greencycle'),
  DB_PASSWORD: Joi.string().allow('').default('greencycle'),
  DB_NAME: Joi.string().default('greencycle'),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),

  JWT_SECRET: Joi.string().min(16).default('change-me'),
  JWT_ACCESS_TTL: Joi.string().default('900s'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(20).default(12),
  // SMTP настройки (опционально)
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_FROM: Joi.string().allow('').optional(),
});

