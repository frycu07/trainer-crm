// jedyne miejsce w projekcie, ktore czyta process.env
// wczytuje .env z katalogu glownego repo, waliduje zmienne schematem Zod i przy bledzie zatrzymuje aplikacje
const path = require("node:path");
const { z } = require("zod");

try {
  process.loadEnvFile(path.join(__dirname, "../../../.env"));
} catch {
  // brak .env - w Dockerze i w CI zmienne przychodza z zewnatrz
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "DATABASE_URL must be a valid postgres:// connection URL"
  }),
  TEST_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  JWT_EXPIRES_IN: z.string()
    .regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 30s, 15m, 8h or 7d")
    .default("8h"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  // potrzebne tylko seedowi
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const config = { ...result.data };

// testy nigdy nie dotykaja bazy deweloperskiej
if (config.NODE_ENV === "test") {
  if (!config.TEST_DATABASE_URL) {
    console.error("TEST_DATABASE_URL is required when NODE_ENV=test");
    process.exit(1);
  }
  config.DATABASE_URL = config.TEST_DATABASE_URL;
}

module.exports = Object.freeze(config);
