export type DatabaseConfig = {
  database?: string;
  host?: string;
  password?: string;
  port?: number;
  user?: string;
};

export function getReadReplicaDbConfigFromEnv(
  env: Record<string, string | undefined>,
): DatabaseConfig {
  return {
    host: env.POSTGRES_READ_HOST ?? env.POSTGRES_HOST,
    port: Number(env.POSTGRES_READ_PORT ?? env.POSTGRES_PORT),
    database: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
  };
}
