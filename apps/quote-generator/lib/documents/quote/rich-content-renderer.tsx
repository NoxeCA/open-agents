import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import { colors } from "@/lib/documents/shared/constants";

import type { QuoteRichContentBlock } from "./rich-content";

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  headingH1: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.dark,
    textTransform: "uppercase",
  },
  headingH2: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.dark,
  },
  headingH3: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.25,
    color: colors.dark,
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.45,
    color: colors.dark,
  },
  paragraphMuted: {
    color: colors.gray,
  },
  paragraphLead: {
    fontSize: 14,
    lineHeight: 1.4,
    color: colors.gray,
  },
  quoteBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.dark,
    paddingLeft: 12,
    gap: 6,
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 1.45,
    color: colors.dark,
  },
  quoteAttribution: {
    fontSize: 10,
    color: colors.gray,
  },
  listBlock: {
    gap: 8,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.25,
    color: colors.dark,
    textTransform: "uppercase",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  listMarker: {
    width: 14,
    fontSize: 11,
    color: colors.dark,
  },
  listText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 1.45,
    color: colors.dark,
  },
  tableBlock: {
    gap: 8,
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.25,
    color: colors.dark,
    textTransform: "uppercase",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F7F7F7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    justifyContent: "center",
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.gray,
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 11,
    lineHeight: 1.35,
    color: colors.dark,
  },
  tableCaption: {
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.gray,
  },
  imageBlock: {
    gap: 8,
  },
  image: {
    width: "100%",
    objectFit: "contain",
  },
  imageCaption: {
    fontSize: 10,
    lineHeight: 1.4,
    color: colors.gray,
  },
  statsBlock: {
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "31%",
    minWidth: 120,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 4,
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.gray,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.dark,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
});

function resolveTextAlign(
  align?: "left" | "center" | "right",
): "left" | "center" | "right" | undefined {
  return align;
}

function resolveFlexWeights(
  weights: Array<number | undefined>,
  fallbackCount: number,
) {
  const values = weights.map((weight) => weight ?? 1);
  const total = values.reduce((sum, weight) => sum + weight, 0);
  return Array.from({ length: fallbackCount }, (_, index) => values[index] / total);
}

export function QuoteRichContentRenderer({
  blocks,
}: {
  blocks: QuoteRichContentBlock[];
}) {
  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading": {
            const headingStyle =
              block.level === "h1"
                ? styles.headingH1
                : block.level === "h3"
                  ? styles.headingH3
                  : styles.headingH2;
            return (
              <Text
                key={key}
                style={[
                  headingStyle,
                  block.align ? { textAlign: resolveTextAlign(block.align) } : {},
                ]}
              >
                {block.text}
              </Text>
            );
          }
          case "paragraph": {
            return (
              <Text
                key={key}
                style={[
                  styles.paragraph,
                  block.tone === "muted"
                    ? styles.paragraphMuted
                    : block.tone === "lead"
                      ? styles.paragraphLead
                      : {},
                  block.align
                    ? { textAlign: resolveTextAlign(block.align) }
                    : {},
                ]}
              >
                {block.text}
              </Text>
            );
          }
          case "quote": {
            return (
              <View key={key} style={styles.quoteBox}>
                <Text style={styles.quoteText}>{block.text}</Text>
                {block.attribution ? (
                  <Text style={styles.quoteAttribution}>{block.attribution}</Text>
                ) : null}
              </View>
            );
          }
          case "list": {
            return (
              <View key={key} style={styles.listBlock}>
                {block.title ? (
                  <Text style={styles.listTitle}>{block.title}</Text>
                ) : null}
                {block.items.map((item, itemIndex) => (
                  <View key={`${key}-item-${itemIndex}`} style={styles.listRow}>
                    <Text style={styles.listMarker}>
                      {block.ordered ? `${itemIndex + 1}.` : "•"}
                    </Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            );
          }
          case "table": {
            const widths = resolveFlexWeights(
              block.columns.map((column) => column.weight),
              block.columns.length,
            );

            return (
              <View key={key} style={styles.tableBlock}>
                {block.title ? (
                  <Text style={styles.tableTitle}>{block.title}</Text>
                ) : null}
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    {block.columns.map((column, columnIndex) => (
                      <View
                        key={`${key}-header-${columnIndex}`}
                        style={[
                          styles.tableCell,
                          { flex: widths[columnIndex] },
                          columnIndex === block.columns.length - 1
                            ? styles.tableCellLast
                            : {},
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableHeaderText,
                            column.align
                              ? { textAlign: resolveTextAlign(column.align) }
                              : {},
                          ]}
                        >
                          {column.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {block.rows.map((row, rowIndex) => (
                    <View
                      key={`${key}-row-${rowIndex}`}
                      style={[
                        styles.tableRow,
                        rowIndex === block.rows.length - 1
                          ? styles.tableRowLast
                          : {},
                      ]}
                    >
                      {block.columns.map((column, columnIndex) => (
                        <View
                          key={`${key}-row-${rowIndex}-cell-${columnIndex}`}
                          style={[
                            styles.tableCell,
                            { flex: widths[columnIndex] },
                            columnIndex === block.columns.length - 1
                              ? styles.tableCellLast
                              : {},
                          ]}
                        >
                          <Text
                            style={[
                              styles.tableCellText,
                              column.align
                                ? { textAlign: resolveTextAlign(column.align) }
                                : {},
                            ]}
                          >
                            {row[columnIndex] ?? ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
                {block.caption ? (
                  <Text style={styles.tableCaption}>{block.caption}</Text>
                ) : null}
              </View>
            );
          }
          case "image": {
            const imageWidth = `${block.widthPercent}%`;
            return (
              <View
                key={key}
                style={[
                  styles.imageBlock,
                  block.align === "center"
                    ? { alignItems: "center" }
                    : block.align === "right"
                      ? { alignItems: "flex-end" }
                      : {},
                ]}
              >
                <Image
                  src={block.src}
                  style={[styles.image, { width: imageWidth }]}
                />
                {block.caption ? (
                  <Text
                    style={[
                      styles.imageCaption,
                      block.align
                        ? { textAlign: resolveTextAlign(block.align) }
                        : {},
                    ]}
                  >
                    {block.caption}
                  </Text>
                ) : null}
              </View>
            );
          }
          case "stats": {
            return (
              <View key={key} style={styles.statsBlock}>
                {block.title ? (
                  <Text style={styles.tableTitle}>{block.title}</Text>
                ) : null}
                <View style={styles.statsGrid}>
                  {block.items.map((item, itemIndex) => (
                    <View key={`${key}-stat-${itemIndex}`} style={styles.statCard}>
                      <Text style={styles.statLabel}>{item.label}</Text>
                      <Text style={styles.statValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          case "divider":
            return <View key={key} style={styles.divider} />;
          case "spacer":
            return <View key={key} style={{ height: block.height }} />;
          default:
            return null;
        }
      })}
    </View>
  );
}
