/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`ALTER TABLE public.posts RENAME TO threads;`);
  pgm.sql(`ALTER TABLE public.threads RENAME COLUMN body TO content;`);
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT posts_pkey to threads_pkey;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT posts_body_check to threads_content_check;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT posts_user_id_fkey to threads_user_id_fkey;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT posts_group_id_fkey to threads_group_id_fkey;`,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT threads_group_id_fkey TO posts_group_id_fkey;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT threads_user_id_fkey TO posts_user_id_fkey;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT threads_content_check TO posts_body_check;`,
  );
  pgm.sql(
    `ALTER TABLE public.threads RENAME CONSTRAINT threads_pkey TO posts_pkey;`,
  );
  pgm.sql(`ALTER TABLE public.threads RENAME COLUMN content TO body;`);
  pgm.sql(`ALTER TABLE public.threads RENAME TO posts;`);
};
