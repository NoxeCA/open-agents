import React, { FC } from 'react';
import { Image, Link as RPdfLink, Text, View } from '@react-pdf/renderer';
import type { z } from 'zod';
import { formatCurrency } from '@/lib/documents/quote/shared/formatters';
import { useBrand } from '../../brand';
import type {
  calloutProps,
  keyValueTableProps,
  metricProps,
  metricGridProps,
  priceComparisonProps,
  ceoMessageCardProps,
  termsAndConditionsProps,
  keepTogetherProps,
  linkProps,
  pageNumberProps,
  tableProps,
  richTextProps,
} from '../../catalog/atoms/primitives';

type CalloutProps = z.infer<typeof calloutProps>;
type KeyValueTableProps = z.infer<typeof keyValueTableProps>;
type MetricProps = z.infer<typeof metricProps>;
type MetricGridProps = z.infer<typeof metricGridProps>;
type PriceComparisonProps = z.infer<typeof priceComparisonProps>;
type CeoMessageCardProps = z.infer<typeof ceoMessageCardProps>;
type TermsAndConditionsProps = z.infer<typeof termsAndConditionsProps>;
type KeepTogetherPropsBase = z.infer<typeof keepTogetherProps>;
type KeepTogetherProps = KeepTogetherPropsBase & { children?: React.ReactNode };
type LinkProps = z.infer<typeof linkProps>;
type PageNumberProps = z.infer<typeof pageNumberProps>;
type TableProps = z.infer<typeof tableProps>;
type RichTextProps = z.infer<typeof richTextProps>;

const WARNING_AMBER = '#F5A524';

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

export const CalloutRenderer: FC<CalloutProps> = ({ title, text, variant, showIcon }) => {
  const brand = useBrand();
  const barColor =
    variant === 'accent'
      ? brand.colors.cyan
      : variant === 'warning'
        ? WARNING_AMBER
        : variant === 'neutral'
          ? brand.colors.dark
          : brand.colors.gray;

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: brand.colors.borderLight,
        borderRadius: 6,
        overflow: 'hidden',
      }}
      wrap={false}
    >
      <View style={{ width: 4, backgroundColor: barColor }} />
      <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
        {title && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            {showIcon && brand.assets.infoIcon && (
              <Image style={{ width: 10, height: 10 }} src={brand.assets.infoIcon} />
            )}
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontWeight: 700,
                fontSize: 11,
                color: brand.colors.dark,
              }}
            >
              {title}
            </Text>
          </View>
        )}
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: 400,
            fontSize: 10,
            lineHeight: 1.4,
            color: brand.colors.dark,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// KeyValueTable
// ---------------------------------------------------------------------------

export const KeyValueTableRenderer: FC<KeyValueTableProps> = ({
  rows,
  columns,
  labelWidthPercent,
}) => {
  const brand = useBrand();
  const cols = columns ?? 1;
  const labelWidth = `${labelWidthPercent ?? 30}%`;

  // Split rows into columns, top-to-bottom.
  const perColumn = Math.ceil(rows.length / cols);
  const buckets: typeof rows[] = Array.from({ length: cols }, (_, i) =>
    rows.slice(i * perColumn, (i + 1) * perColumn)
  );

  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {buckets.map((bucket, ci) => (
        <View
          key={ci}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: brand.colors.borderLight,
            borderRadius: 6,
          }}
        >
          {bucket.map((row, ri) => (
            <View
              key={ri}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: ri % 2 === 1 ? brand.colors.rowAlt : 'transparent',
                borderBottomWidth: ri < bucket.length - 1 ? 1 : 0,
                borderBottomColor: brand.colors.borderLight,
              }}
            >
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 700,
                  fontSize: 10,
                  color: brand.colors.dark,
                  width: labelWidth as unknown as number,
                }}
              >
                {row.label}
              </Text>
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 400,
                  fontSize: 10,
                  color: brand.colors.dark,
                  flex: 1,
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Metric
// ---------------------------------------------------------------------------

export const MetricRenderer: FC<MetricProps> = ({ value, label, trend, align }) => {
  const brand = useBrand();
  const alignment = align ?? 'left';
  const alignItems =
    alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

  return (
    <View style={{ flexDirection: 'column', alignItems }}>
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 32,
          letterSpacing: -0.5,
          color: brand.colors.dark,
          textAlign: alignment,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 400,
          fontSize: 10,
          color: brand.colors.grayMedium,
          marginTop: 2,
          textAlign: alignment,
        }}
      >
        {label}
      </Text>
      {trend && (
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: 400,
            fontSize: 8,
            color: brand.colors.gray,
            marginTop: 2,
            textAlign: alignment,
          }}
        >
          {trend}
        </Text>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// MetricGrid
// ---------------------------------------------------------------------------

export const MetricGridRenderer: FC<MetricGridProps> = ({ items, columns }) => {
  const brand = useBrand();
  const cols = columns ?? 3;
  const widthPct = `${Math.floor(100 / cols - 2)}%`;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((item, i) => (
        <View
          key={i}
          style={{
            width: widthPct as unknown as number,
            borderWidth: 1,
            borderColor: brand.colors.borderLight,
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: -0.5,
              color: brand.colors.dark,
            }}
          >
            {item.value}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 400,
              fontSize: 10,
              color: brand.colors.grayMedium,
              marginTop: 2,
            }}
          >
            {item.label}
          </Text>
          {item.trend && (
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontWeight: 400,
                fontSize: 8,
                color: brand.colors.gray,
                marginTop: 2,
              }}
            >
              {item.trend}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// PriceComparison
// ---------------------------------------------------------------------------

export const PriceComparisonRenderer: FC<PriceComparisonProps> = ({ options }) => {
  const brand = useBrand();

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {options.map((opt, i) => {
        const highlighted = !!opt.highlighted;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              borderWidth: highlighted ? 2 : 1,
              borderColor: highlighted ? brand.colors.cyan : brand.colors.borderLight,
              borderRadius: 6,
              padding: 12,
              backgroundColor: highlighted ? brand.colors.rowAlt : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontWeight: 700,
                fontSize: 8,
                color: highlighted ? brand.colors.cyan : brand.colors.grayMedium,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {opt.title}
            </Text>
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontWeight: 700,
                fontSize: 20,
                color: brand.colors.dark,
                marginBottom: 10,
              }}
            >
              {formatCurrency(opt.price, brand.lang)}
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: brand.colors.borderLight,
                marginBottom: 8,
              }}
            />
            {opt.features.map((f, fi) => (
              <View
                key={fi}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'URWGeometric',
                    fontWeight: 700,
                    fontSize: 10,
                    color: highlighted ? brand.colors.cyan : brand.colors.dark,
                  }}
                >
                  {'\u2022'}
                </Text>
                <Text
                  style={{
                    fontFamily: 'URWGeometric',
                    fontWeight: 400,
                    fontSize: 9,
                    lineHeight: 1.4,
                    color: brand.colors.dark,
                    flex: 1,
                  }}
                >
                  {f}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

// ---------------------------------------------------------------------------
// CeoMessageCard
// ---------------------------------------------------------------------------

export const CeoMessageCardRenderer: FC<CeoMessageCardProps> = ({
  name,
  title,
  message,
  photo,
  pills,
}) => {
  const brand = useBrand();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: brand.colors.borderLight,
        borderRadius: 6,
        padding: 16,
        gap: 16,
      }}
    >
      {photo && (
        <Image
          src={photo}
          style={{
            width: 80,
            height: 80,
            borderRadius: 6,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: 700,
            fontSize: 8,
            color: brand.colors.grayMedium,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: 700,
            fontSize: 14,
            color: brand.colors.dark,
            marginBottom: 8,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: 400,
            fontSize: 10,
            lineHeight: 1.5,
            color: brand.colors.dark,
          }}
        >
          {message}
        </Text>
        {pills && pills.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 10,
            }}
          >
            {pills.map((p, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: brand.colors.borderLight,
                  backgroundColor: brand.colors.rowAlt,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'URWGeometric',
                    fontWeight: 700,
                    fontSize: 8,
                    color: brand.colors.dark,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {p}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// TermsAndConditions
// ---------------------------------------------------------------------------

export const TermsAndConditionsRenderer: FC<TermsAndConditionsProps> = ({
  sections,
  columns,
}) => {
  const brand = useBrand();
  const cols = columns ?? 2;

  // Distribute sections across columns top-to-bottom.
  const perColumn = Math.ceil(sections.length / cols);
  const buckets: typeof sections[] = Array.from({ length: cols }, (_, i) =>
    sections.slice(i * perColumn, (i + 1) * perColumn)
  );

  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {buckets.map((bucket, ci) => (
        <View key={ci} style={{ flex: 1, flexDirection: 'column', gap: 8 }}>
          {bucket.map((s, si) => (
            <View key={si} style={{ flexDirection: 'column' }}>
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 700,
                  fontSize: 9,
                  color: brand.colors.dark,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                {s.title}
              </Text>
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 400,
                  fontSize: 8,
                  lineHeight: 1.5,
                  color: brand.colors.gray,
                }}
              >
                {s.text}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// KeepTogether
// ---------------------------------------------------------------------------

export const KeepTogetherRenderer: FC<KeepTogetherProps> = ({ children }) => {
  return <View wrap={false}>{children}</View>;
};

// ---------------------------------------------------------------------------
// Link
// ---------------------------------------------------------------------------

export const LinkRenderer: FC<LinkProps> = ({ text, href, color }) => {
  const brand = useBrand();
  return (
    <RPdfLink
      src={href}
      style={{
        color: color ?? brand.colors.cyan,
        textDecoration: 'underline',
      }}
    >
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 400,
          fontSize: 10,
          color: color ?? brand.colors.cyan,
        }}
      >
        {text}
      </Text>
    </RPdfLink>
  );
};

// ---------------------------------------------------------------------------
// PageNumber
// ---------------------------------------------------------------------------

export const PageNumberRenderer: FC<PageNumberProps> = ({ format }) => {
  const brand = useBrand();
  const template = format ?? 'Page {current} of {total}';
  return (
    <Text
      fixed
      style={{
        fontFamily: 'URWGeometric',
        fontWeight: 400,
        fontSize: 9,
        color: brand.colors.gray,
      }}
      render={({ pageNumber, totalPages }) =>
        template
          .replace('{current}', String(pageNumber))
          .replace('{total}', String(totalPages))
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const TableRenderer: FC<TableProps> = ({ columns, rows, striped, compact }) => {
  const brand = useBrand();
  const isCompact = compact ?? false;
  const isStriped = striped ?? true;
  const vPad = isCompact ? 5 : 8;
  const hPad = isCompact ? 6 : 10;
  const fontSize = isCompact ? 9 : 10;

  const columnStyle = (idx: number) => {
    const col = columns[idx];
    const style: Record<string, unknown> = {};
    if (col.width) {
      style.width = col.width;
    } else {
      style.flex = 1;
    }
    return style;
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: brand.colors.borderLight,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: brand.colors.dark,
          paddingVertical: vPad,
          paddingHorizontal: 0,
        }}
      >
        {columns.map((col, ci) => (
          <View
            key={ci}
            style={{
              ...columnStyle(ci),
              paddingHorizontal: hPad,
            }}
          >
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontWeight: 700,
                fontSize,
                color: brand.colors.white,
                textAlign: col.align ?? 'left',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {col.header}
            </Text>
          </View>
        ))}
      </View>
      {/* Body */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={{
            flexDirection: 'row',
            backgroundColor:
              isStriped && ri % 2 === 1 ? brand.colors.rowAlt : 'transparent',
            borderTopWidth: ri === 0 ? 0 : 1,
            borderTopColor: brand.colors.borderLight,
            paddingVertical: vPad,
          }}
        >
          {columns.map((col, ci) => (
            <View
              key={ci}
              style={{
                ...columnStyle(ci),
                paddingHorizontal: hPad,
              }}
            >
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 400,
                  fontSize,
                  color: brand.colors.dark,
                  textAlign: col.align ?? 'left',
                }}
              >
                {row[ci] ?? ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------
// RichText
// ---------------------------------------------------------------------------

export const RichTextRenderer: FC<RichTextProps> = ({ spans, align, size }) => {
  const brand = useBrand();
  const resolvedAlign = align ?? 'left';
  const resolvedSize = size ?? 10;

  return (
    <Text
      style={{
        fontFamily: 'URWGeometric',
        fontWeight: 400,
        fontSize: resolvedSize,
        lineHeight: 1.4,
        color: brand.colors.dark,
        textAlign: resolvedAlign,
      }}
    >
      {spans.map((s, i) => (
        <Text
          key={i}
          style={{
            fontFamily: 'URWGeometric',
            fontWeight: s.bold ? 700 : 400,
            color: s.color ?? brand.colors.dark,
          }}
        >
          {s.text}
        </Text>
      ))}
    </Text>
  );
};
