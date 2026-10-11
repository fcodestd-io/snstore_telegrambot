import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  boolean,
  bigint,
  integer,
  index,
} from "drizzle-orm/pg-core";

// ======================================================
// PRODUCTS
// ======================================================

export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  price: numeric("price", {
    precision: 12,
    scale: 2,
  }).notNull(),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ======================================================
// PAYMENTS
// ======================================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  accountName: text("account_name"),

  accountNumber: text("account_number"),

  imageUrl: text("image_url"),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ======================================================
// BOT COMMANDS
// ======================================================

export const botCommands = pgTable("bot_commands", {
  id: serial("id").primaryKey(),

  command: text("command").notNull().unique(),

  title: text("title").notNull(),

  responseMessage: text("response_message").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ======================================================
// STOCKS
// Stok akun premium yang nantinya dikirim bot.
// ======================================================

export const stocks = pgTable(
  "stocks",
  {
    id: serial("id").primaryKey(),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    accountData: text("account_data").notNull(),

    isSold: boolean("is_sold").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stocks_product_sold_idx").on(table.productId, table.isSold),
  ],
);

// ======================================================
// ORDERS
//
// Flow status:
// PENDING -> PROCESSING -> SUCCESS
//                       -> REJECTED
// ======================================================

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),

    telegramId: bigint("telegram_id", {
      mode: "number",
    }).notNull(),

    telegramUsername: text("telegram_username"),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "restrict",
      }),

    quantity: integer("quantity").default(1).notNull(),

    proofFileId: text("proof_file_id"),

    status: text("status").default("PENDING").notNull(),

    sentAccountData: text("sent_account_data"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("orders_status_idx").on(table.status)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),

    telegramId: bigint("telegram_id", {
      mode: "number",
    }).notNull(),

    role: text("role").notNull(),

    content: text("content").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("chat_messages_telegram_idx").on(t.telegramId, t.createdAt)],
);
