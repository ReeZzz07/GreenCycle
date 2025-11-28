export const configuration = () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10)
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'greencycle',
    password: process.env.DB_PASSWORD ?? 'greencycle',
    name: process.env.DB_NAME ?? 'greencycle',
    logging: (process.env.DB_LOGGING ?? 'false').toLowerCase() === 'true',
    ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true'
  },
  auth: {
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10)
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD
  },
  throttler: {
    ttl: parseInt(process.env.THROTTLER_TTL ?? '60', 10), // 60 секунд
    limit: parseInt(process.env.THROTTLER_LIMIT ?? '100', 10), // 100 запросов
    authLimit: parseInt(process.env.THROTTLER_AUTH_LIMIT ?? '5', 10), // 5 запросов для аутентификации
    authTtl: parseInt(process.env.THROTTLER_AUTH_TTL ?? '60', 10) // 60 секунд для аутентификации
  }
});

export type AppConfig = ReturnType<typeof configuration>;

