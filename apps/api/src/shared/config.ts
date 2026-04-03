import * as z from "zod";

const envSchema = z.object({
  // ------ SERVER CONFIG ------
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ------ DB CONFIG ------
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // ------ JWT CONFIG ------
  JWT_ACCESS_TOKEN: z.string().min(1),
  JWT_REFRESH_TOKEN: z.string().min(1),
  SET_INFO_TOKEN: z.string().min(1),

  // ------ EMAIL CONFIG ------
  RESEND_API_KEY: z.string().min(1),

  // ------ AUTH CONFIG ------
  DUMMY_HASH: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const env = parsedEnv.data;

export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
  },
  jwt: {
    accessTokenSecret: env.JWT_ACCESS_TOKEN,
    refreshTokenSecret: env.JWT_REFRESH_TOKEN,
    setInfoTokenSecret: env.SET_INFO_TOKEN,
  },
  email: {
    resendSecret: env.RESEND_API_KEY,
  },
  auth: {
    dummyHash: env.DUMMY_HASH,
  },
};
