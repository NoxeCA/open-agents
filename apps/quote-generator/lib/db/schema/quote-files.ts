import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { quotes } from "./quotes";

export const quoteFiles = pgTable(
  "quote_files",
  {
    id: text("id").primaryKey(),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["excel", "pdf", "context"] }).notNull(),
    mediaType: text("media_type").notNull(),
    blobUrl: text("blob_url").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    filename: text("filename").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256"),
    analysis: jsonb("analysis"),
    analyzedAt: timestamp("analyzed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("quote_files_quote_id_kind_idx").on(t.quoteId, t.kind)],
);

export type QuoteFile = typeof quoteFiles.$inferSelect;
