import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "test") {
  config({ path: ".env.test" });
} else {
  // Vai procurar as variáveis ambiente no .env
  config();
}

// Joi, Yup, Zod

// process.env

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),

  DATABASE_CLIENT: z.enum(["sqlite", "pg"]),

  DATABASE_URL: z.string(), // se pudesse ter um valor vazio, colocariamos .nullable() no final

  // Colocando um valor default em uma variável ela deixa de ser obrigatória
  PORT: z.coerce.number().default(3333),
});

// Validando os dados
// O parse automáticamente se não estiver tudo certo, lança um erro qualquer

// safeParse é como se fosse o parse, porém não dispara um erro caso a validação falhar
const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("⚠ Invalid environment variables!", _env.error.format());

  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
