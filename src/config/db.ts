import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  max: 5,
  connectionTimeoutMillis: 2000,
});

export const connectDB = async () => {
  await pool.connect();
};

export const disconnectDB = async () => {
  await pool.end();
};

export const resetDB = async () => {
  const query = `
  TRUNCATE TABLE users cascade;
  `;
  await pool.query(query);
};
