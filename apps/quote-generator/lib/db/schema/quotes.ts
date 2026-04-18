import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled quote"),
    lang: text("lang", { enum: ["fr", "en"] }).notNull().default("fr"),
    data: jsonb("data").notNull().default({}),
    lastRenderedAt: timestamp("last_rendered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("quotes_user_id_idx").on(t.userId)],
);

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
