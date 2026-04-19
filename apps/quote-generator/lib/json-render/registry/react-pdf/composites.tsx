import React, { FC } from 'react';
import { Image, Text, View } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/documents/quote/shared/formatters';
import { useBrand } from '../../brand';
import type {
  taxDisclaimerProps,
  totalCostBoxProps,
  summaryTableProps,
  infoGridProps,
  signatureBlockProps,
  continuationHeaderProps,
  teamCardProps,
  partnerGridProps,
} from '../../catalog/composites/primitives';
import type { z } from 'zod';

type TaxDisclaimerProps = z.infer<typeof taxDisclaimerProps>;
type TotalCostBoxProps = z.infer<typeof totalCostBoxProps>;
type SummaryTableProps = z.infer<typeof summaryTableProps>;
type InfoGridProps = z.infer<typeof infoGridProps>;
type SignatureBlockProps = z.infer<typeof signatureBlockProps>;
type ContinuationHeaderProps = z.infer<typeof continuationHeaderProps>;
type TeamCardProps = z.infer<typeof teamCardProps>;
type PartnerGridProps = z.infer<typeof partnerGridProps>;

export const TaxDisclaimerRenderer: FC<TaxDisclaimerProps> = ({ text, showIcon }) => {
  const brand = useBrand();
  const body = text ?? brand.translations.common.taxDisclaimer;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
      wrap={false}
    >
      {showIcon && brand.assets.infoIcon && (
        <Image style={{ width: 10, height: 10 }} src={brand.assets.infoIcon} />
      )}
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontSize: 8,
          color: brand.colors.gray,
        }}
      >
        {body}
      </Text>
    </View>
  );
};

export const TotalCostBoxRenderer: FC<TotalCostBoxProps> = ({ amount, label }) => {
  const brand = useBrand();
  const resolvedLabel = label ?? brand.translations.common.totalCost;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: brand.colors.dark,
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}
      wrap={false}
    >
      <View
        style={{
          width: 4,
          height: '100%',
          backgroundColor: brand.colors.cyan,
          marginRight: 12,
        }}
      />
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 14,
          color: brand.colors.white,
          flex: 1,
        }}
      >
        {resolvedLabel}
      </Text>
      <Text
        style={{
          fontFamily: 'URWGeometric',
          fontWeight: 700,
          fontSize: 18,
          color: brand.colors.cyan,
        }}
      >
        {formatCurrency(amount, brand.lang)}
      </Text>
    </View>
  );
};

export const SummaryTableRenderer: FC<SummaryTableProps> = ({
  rows,
  subtotalLabel,
  subtotalAmount,
}) => {
  const brand = useBrand();
  return (
    <View
      style={{
        borderRadius: 6,
        borderWidth: 1,
        borderColor: brand.colors.borderLight,
      }}
    >
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: i % 2 === 1 ? brand.colors.rowAlt : 'transparent',
            borderBottomWidth: i < rows.length - 1 ? 1 : 0,
            borderBottomColor: brand.colors.borderLight,
          }}
        >
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 10,
              color: brand.colors.dark,
              flex: 1,
            }}
          >
            {row.label}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 10,
              color: brand.colors.dark,
            }}
          >
            {formatCurrency(row.amount, brand.lang)}
          </Text>
        </View>
      ))}
      {subtotalAmount !== undefined && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: brand.colors.borderLight,
            backgroundColor: brand.colors.rowAlt,
          }}
        >
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 11,
              color: brand.colors.dark,
              flex: 1,
            }}
          >
            {subtotalLabel ?? brand.translations.common.subtotal}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 11,
              color: brand.colors.dark,
            }}
          >
            {formatCurrency(subtotalAmount, brand.lang)}
          </Text>
        </View>
      )}
    </View>
  );
};

export const InfoGridRenderer: FC<InfoGridProps> = ({ rows, rowMinHeight }) => {
  const brand = useBrand();
  return (
    <View style={{ flexDirection: 'column' }}>
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={{
            flexDirection: 'row',
            minHeight: rowMinHeight,
            borderTopWidth: ri === 0 ? 1 : 0,
            borderBottomWidth: 1,
            borderColor: brand.colors.borderLight,
          }}
        >
          {row.cells.map((cell, ci) => (
            <React.Fragment key={ci}>
              {ci > 0 && (
                <View style={{ width: 1, backgroundColor: brand.colors.borderLight }} />
              )}
              <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text
                  style={{
                    fontFamily: 'URWGeometric',
                    fontSize: 8,
                    color: brand.colors.grayMedium,
                    marginBottom: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {cell.label}
                </Text>
                {cell.values.map((v, vi) => (
                  <Text
                    key={vi}
                    style={{
                      fontFamily: 'URWGeometric',
                      fontWeight: 700,
                      fontSize: 10,
                      color: brand.colors.dark,
                    }}
                  >
                    {v}
                  </Text>
                ))}
              </View>
            </React.Fragment>
          ))}
        </View>
      ))}
    </View>
  );
};

export const SignatureBlockRenderer: FC<SignatureBlockProps> = ({ parties }) => {
  const brand = useBrand();
  return (
    <View style={{ flexDirection: 'row', gap: 24 }}>
      {parties.map((p, i) => (
        <View key={i} style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 10,
              color: brand.colors.grayMedium,
              marginBottom: 24,
            }}
          >
            {p.label}
          </Text>
          {p.nameLine && (
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: brand.colors.dark,
                height: 1,
                marginBottom: 18,
              }}
            />
          )}
          {p.dateLine && (
            <>
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontSize: 8,
                  color: brand.colors.gray,
                  marginBottom: 4,
                }}
              >
                Date
              </Text>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: brand.colors.dark,
                  height: 1,
                }}
              />
            </>
          )}
        </View>
      ))}
    </View>
  );
};

export const ContinuationHeaderRenderer: FC<ContinuationHeaderProps> = ({ text }) => {
  const brand = useBrand();
  return (
    <View
      fixed
      render={({ pageNumber }) =>
        pageNumber > 1 ? (
          <View
            style={{
              backgroundColor: brand.colors.dark,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontSize: 9,
                color: brand.colors.white,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {text}
            </Text>
          </View>
        ) : (
          <View />
        )
      }
    />
  );
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const TeamCardRenderer: FC<TeamCardProps> = ({ members, columns }) => {
  const brand = useBrand();
  const cols = columns ?? 3;
  const widthPct = `${Math.floor(100 / cols - 2)}%`;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 } as any}>
      {members.map((m, i) => (
        <View
          key={i}
          style={{
            width: widthPct as any,
            borderWidth: 1,
            borderColor: brand.colors.borderLight,
            borderRadius: 6,
            padding: 12,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <View style={{ position: 'relative', width: 64, height: 64 }}>
              {m.photo ? (
                <Image
                  src={m.photo}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: brand.colors.lightGray,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'URWGeometric',
                      fontWeight: 700,
                      fontSize: 18,
                      color: brand.colors.grayMedium,
                    }}
                  >
                    {getInitials(m.name)}
                  </Text>
                </View>
              )}
              {m.experience && (
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    backgroundColor: brand.colors.cyan,
                    borderRadius: 8,
                    paddingHorizontal: 4,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'URWGeometric',
                      fontWeight: 700,
                      fontSize: 8,
                      color: brand.colors.white,
                    }}
                  >
                    {m.experience}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontSize: 8,
              color: brand.colors.gray,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {m.role}
          </Text>
          <Text
            style={{
              fontFamily: 'URWGeometric',
              fontWeight: 700,
              fontSize: 12,
              color: brand.colors.dark,
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            {m.name}
          </Text>
          {m.skills && m.skills.length > 0 && (
            <View style={{ flexDirection: 'column', gap: 6, marginBottom: 8 } as any}>
              {m.skills.map((s, si) => (
                <View key={si} style={{ flexDirection: 'column' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'URWGeometric',
                        fontSize: 8,
                        color: brand.colors.gray,
                        flex: 1,
                      }}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'URWGeometric',
                        fontWeight: 700,
                        fontSize: 8,
                        color: brand.colors.dark,
                      }}
                    >
                      {`${s.level}%`}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '100%',
                      height: 3,
                      backgroundColor: brand.colors.lightGray,
                      borderRadius: 2,
                    }}
                  >
                    <View
                      style={{
                        width: `${s.level}%`,
                        height: 3,
                        backgroundColor: brand.colors.dark,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
          {m.bio && (
            <Text
              style={{
                fontFamily: 'URWGeometric',
                fontSize: 9,
                lineHeight: 1.4,
                color: brand.colors.gray,
              }}
            >
              {m.bio}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export const PartnerGridRenderer: FC<PartnerGridProps> = ({ partners, columns }) => {
  const brand = useBrand();
  const cols = columns ?? 4;
  const widthPct = `${Math.floor(100 / cols - 2)}%`;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as any}>
      {partners.map((p, i) => {
        const isString = typeof p === 'string';
        const name = isString ? p : p.name;
        const logo = isString ? undefined : p.logo;
        return (
          <View
            key={i}
            style={{
              width: widthPct as any,
              paddingHorizontal: 8,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: brand.colors.borderLight,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
            }}
          >
            {logo ? (
              <Image
                src={logo}
                style={{
                  width: '60%',
                  height: 24,
                }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: 'URWGeometric',
                  fontWeight: 700,
                  fontSize: 10,
                  color: brand.colors.dark,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {name}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};
