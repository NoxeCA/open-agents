import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { FC } from 'react';
import type { QuoteTranslations, Language } from '@/lib/locales/loader';
import type { BomItem, ServiceSection } from './types';
import { formatCurrency, formatNumber } from '../../shared/formatters';
import { serviceSectionStyles as styles } from './styles';

type BomLayout = Extract<ServiceSection['layout'], 'itemized-with-price' | 'itemized-without-price'>;

interface BomCardTopProps {
  sectionName: string;
  layout: BomLayout;
  lang: QuoteTranslations;
}

/** The top of the BOM card: title, description, table column header.
 *  Designed to be wrapped in <View fixed> so it repeats on every overflow page. */
export const BomCardTop: FC<BomCardTopProps> = ({ sectionName, layout, lang }) => {
  const description = lang.service.materialsDescription.replace(
    '{section}',
    sectionName.toLowerCase(),
  );
  const isWithPrice = layout === 'itemized-with-price';

  return (
    <View style={styles.bomCardTop}>
      <View style={styles.bomTitleBlock}>
        <Text style={styles.bomTitle}>{lang.service.billOfMaterials}</Text>
      </View>
      <Text style={styles.bomDescription}>{description}</Text>

      <View style={styles.tableHeaderRow}>
        <View style={styles.colQty}>
          <Text style={styles.tableHeaderText}>{lang.service.columns.qty}</Text>
        </View>

        {isWithPrice ? (
          <View style={styles.colPart}>
            <View style={styles.headerDivider} />
            <Text style={styles.tableHeaderText}>{lang.service.columns.partDescription}</Text>
          </View>
        ) : (
          <>
            <View style={styles.colPartNumber}>
              <View style={styles.headerDivider} />
              <Text style={styles.tableHeaderText}>{lang.service.columns.partNumber}</Text>
            </View>
            <View style={styles.colDescription}>
              <View style={styles.headerDivider} />
              <Text style={styles.tableHeaderText}>{lang.service.columns.description}</Text>
            </View>
          </>
        )}

        <View style={styles.colOem}>
          <View style={styles.headerDivider} />
          <Text style={styles.tableHeaderText}>{lang.service.columns.oem}</Text>
        </View>

        {isWithPrice && (
          <>
            <View style={styles.colUnitPrice}>
              <View style={styles.headerDivider} />
              <Text style={styles.tableHeaderText}>{lang.service.columns.unitPrice}</Text>
            </View>
            <View style={styles.colTotal}>
              <View style={styles.headerDivider} />
              <Text style={styles.tableHeaderText}>{lang.service.columns.total}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

interface BomDataRowsProps {
  items: BomItem[];
  subtotal?: number;
  layout: BomLayout;
  lang: QuoteTranslations;
  selectedLang: Language;
}

/** Data rows + subtotal — flowing content, each row wrap=false so nothing splits mid-cell. */
export const BomDataRows: FC<BomDataRowsProps> = ({
  items,
  subtotal,
  layout,
  lang,
  selectedLang,
}) => {
  const isWithPrice = layout === 'itemized-with-price';
  const showSubtotal = subtotal !== undefined;

  return (
    <>
      {items.map((item, i) => {
        const isLastRow = i === items.length - 1;
        // Without subtotal, the last data row rounds the card's bottom corners
        const rowStyle = !showSubtotal && isLastRow
          ? { ...styles.tableRow, ...styles.tableRowLast }
          : styles.tableRow;

        return (
          <View key={i} style={rowStyle} wrap={false}>
            <View style={styles.colQty}>
              <Text style={styles.cellText}>{item.qty}</Text>
            </View>

            {isWithPrice ? (
              <View style={[styles.colPart, styles.cellBorderLeft]}>
                <Text style={styles.cellText}>{item.partNumber}</Text>
                <Text style={styles.cellPartDescription}>{item.description}</Text>
              </View>
            ) : (
              <>
                <View style={[styles.colPartNumber, styles.cellBorderLeft]}>
                  <Text style={styles.cellText}>{item.partNumber}</Text>
                </View>
                <View style={[styles.colDescription, styles.cellBorderLeft]}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </View>
              </>
            )}

            <View style={[styles.colOem, styles.cellBorderLeft]}>
              <Text style={styles.cellOemText}>{item.oem}</Text>
            </View>

            {isWithPrice && (
              <>
                <View style={[styles.colUnitPrice, styles.cellBorderLeft]}>
                  <Text style={styles.cellTextRight}>
                    {formatNumber(item.unitPrice, selectedLang)}
                  </Text>
                </View>
                <View style={[styles.colTotal, styles.cellBorderLeft]}>
                  <Text style={styles.cellTextRight}>
                    {formatNumber(item.total, selectedLang)}
                  </Text>
                </View>
              </>
            )}
          </View>
        );
      })}

      {showSubtotal && (
        <View style={styles.subtotalRow} wrap={false}>
          <Text style={styles.subtotalLabel}>{lang.service.subtotal}</Text>
          <Text style={styles.subtotalAmount}>{formatCurrency(subtotal!, selectedLang)}</Text>
        </View>
      )}
    </>
  );
};

const BomTable: FC<{
  items: BomItem[];
  subtotal?: number;
  sectionName: string;
  layout: BomLayout;
  lang: QuoteTranslations;
  selectedLang: Language;
}> = (props) => (
  <>
    <BomCardTop sectionName={props.sectionName} layout={props.layout} lang={props.lang} />
    <BomDataRows
      items={props.items}
      subtotal={props.subtotal}
      layout={props.layout}
      lang={props.lang}
      selectedLang={props.selectedLang}
    />
  </>
);

export default BomTable;
