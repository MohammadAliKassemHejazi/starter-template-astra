import type { Migration } from '../migrate';

export const migration: Migration = {
  name: '001-init',
  up: `
    CREATE EXTENSION IF NOT EXISTS citext;

    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email citext NOT NULL,
      password_hash text NOT NULL,
      name varchar(100) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      last_login_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX users_email_uq ON users (email);

    CREATE TABLE roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(50) NOT NULL UNIQUE,
      description varchar(255),
      is_system boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key varchar(100) NOT NULL UNIQUE,
      description varchar(255)
    );

    CREATE TABLE user_roles (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );
    CREATE INDEX user_roles_role_idx ON user_roles (role_id);

    CREATE TABLE role_permissions (
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );
    CREATE INDEX role_permissions_permission_idx ON role_permissions (permission_id);

    CREATE TABLE refresh_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_id uuid NOT NULL,
      token_hash char(64) NOT NULL,
      expires_at timestamptz NOT NULL,
      family_expires_at timestamptz NOT NULL,
      used_at timestamptz,
      revoked_at timestamptz,
      replaced_by_id uuid,
      user_agent varchar(255),
      ip inet,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX refresh_tokens_hash_uq ON refresh_tokens (token_hash);
    CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);
    CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
    CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens (expires_at);
  `,
  down: `
    DROP TABLE IF EXISTS refresh_tokens, role_permissions, user_roles, permissions, roles, users;
  `,
};
