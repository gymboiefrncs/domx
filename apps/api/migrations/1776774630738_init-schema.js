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
  pgm.sql(`
    CREATE TYPE public.group_role AS ENUM ('admin', 'member');
  `);

  pgm.sql(`
    CREATE TABLE public.users (
      id uuid DEFAULT uuidv7() NOT NULL,
      email text NOT NULL,
      password text,
      username character varying(30),
      created_at timestamp with time zone DEFAULT now(),
      is_verified boolean DEFAULT false NOT NULL,
      display_id character varying(20),
      CONSTRAINT users_pkey PRIMARY KEY (id),
      CONSTRAINT users_email_key UNIQUE (email),
      CONSTRAINT users_username_key UNIQUE (username),
      CONSTRAINT users_display_id_key UNIQUE (display_id),
      CONSTRAINT users_display_id_check CHECK (display_id ~ '^[A-Z0-9]{8}$')
    );
  `);

  pgm.sql(`
    CREATE TABLE public.groups (
      group_id uuid DEFAULT uuidv7() NOT NULL,
      name character varying(50) NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT groups_pkey PRIMARY KEY (group_id)
    );
  `);

  pgm.sql(`
    CREATE TABLE public.email_verification (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id uuid NOT NULL,
      otp_hash text NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      used_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      retries integer DEFAULT 0,
      CONSTRAINT email_verification_token_key UNIQUE (otp_hash),
      CONSTRAINT email_verification_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
    );
  `);

  pgm.sql(`
    CREATE TABLE public.refresh_token (
      jti uuid NOT NULL,
      user_id uuid NOT NULL,
      token_hash text NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT refresh_token_pkey PRIMARY KEY (jti),
      CONSTRAINT refresh_token_token_hash_key UNIQUE (token_hash),
      CONSTRAINT refresh_token_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
    );
  `);

  pgm.sql(`
    CREATE TABLE public.group_members (
      user_id uuid NOT NULL,
      group_id uuid NOT NULL,
      role public.group_role DEFAULT 'member' NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      joined_at timestamp with time zone DEFAULT now() NOT NULL,
      last_seen_at timestamp with time zone DEFAULT now(),
      CONSTRAINT group_members_pkey PRIMARY KEY (user_id, group_id),
      CONSTRAINT group_members_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
      CONSTRAINT group_members_group_id_fkey
        FOREIGN KEY (group_id) REFERENCES public.groups(group_id) ON DELETE CASCADE
    );
  `);

  pgm.sql(`
    CREATE TABLE public.posts (
      id uuid DEFAULT uuidv7() NOT NULL,
      user_id uuid NOT NULL,
      group_id uuid NOT NULL,
      title character varying(50) NOT NULL,
      body text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT posts_pkey PRIMARY KEY (id),
      CONSTRAINT posts_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 10000),
      CONSTRAINT posts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
      CONSTRAINT posts_group_id_fkey
        FOREIGN KEY (group_id) REFERENCES public.groups(group_id) ON DELETE CASCADE
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP TABLE public.posts;`);
  pgm.sql(`DROP TABLE public.group_members;`);
  pgm.sql(`DROP TABLE public.refresh_token;`);
  pgm.sql(`DROP TABLE public.email_verification;`);
  pgm.sql(`DROP TABLE public.groups;`);
  pgm.sql(`DROP TABLE public.users;`);
  pgm.sql(`DROP TYPE public.group_role;`);
};
