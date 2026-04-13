import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  email_verified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  clinicId: integer("clinic_id"),
  role: text("role").default("receptionist").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    expires_at: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.user_id)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    account_id: text("account_id").notNull(),
    provider_id: text("provider_id").notNull(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    id_token: text("id_token"),
    access_token_expires_at: timestamp("access_token_expires_at"),
    refresh_token_expires_at: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.user_id)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expires_at: timestamp("expires_at").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessionss: many(sessions),
  accountss: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.user_id],
    references: [users.id],
  }),
}));
