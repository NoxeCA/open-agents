import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations, Language } from '../../../../locales/loader';
import type { QuoteData } from '../../types';
import type { PageNumberCollector } from '../../shared/pagination';
import { SECTION_KEYS } from '../../shared/pagination';
import { formatCurrency } from '../../shared/formatters';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { serviceSectionStyles as serviceStyles } from '../09-service-section/styles';
import { projectSummaryStyles as styles } from './styles';

interface ProjectSummaryPageProps {
  data: QuoteData;
  lang: QuoteTranslations;
  selectedLang: Language;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  infoIconBase64: string;
  pageNumbers: PageNumberCollector;
}

const ProjectSummaryPage: FC<ProjectSummaryPageProps> = ({
  data,
  lang,
  selectedLang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  infoIconBase64,
  pageNumbers,
}) => {
  const { projectSummary, services } = data;

  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.projectSummary} position="start" />

      {/* Page title */}
      <Text style={styles.pageTitle}>{lang.projectSummary.title}</Text>

      {/* Project subtitle + description */}
      <View style={styles.projectBlock}>
        <Text style={styles.projectSubtitle}>{data.projectTitle}</Text>
        {projectSummary.description && (
          <Text style={styles.projectDescription}>{projectSummary.description}</Text>
        )}
      </View>

      {/* Sections table (same style as Other Costs) */}
      <View style={serviceStyles.otherCostsCard} wrap={false}>
        {services.map((service, i) => (
          <React.Fragment key={i}>
            <View style={serviceStyles.otherCostsRow} wrap={false}>
              <Text style={serviceStyles.otherCostsLabel}>{service.sectionName}</Text>
              <View style={serviceStyles.otherCostsVerticalDivider} />
              <Text style={serviceStyles.otherCostsAmount}>
                {formatCurrency(service.totalCost, selectedLang)}
              </Text>
            </View>
            {i < services.length - 1 && <View style={serviceStyles.otherCostsDivider} />}
          </React.Fragment>
        ))}

        {/* Subtotal */}
        <View style={serviceStyles.subtotalRowInCard} wrap={false}>
          <Text style={serviceStyles.subtotalLabel}>{lang.service.subtotal}</Text>
          <Text style={serviceStyles.subtotalAmount}>
            {formatCurrency(projectSummary.subtotal, selectedLang)}
          </Text>
        </View>
      </View>

      {/* Total Project Cost Box */}
      <View style={serviceStyles.totalCostBox} wrap={false}>
        <View style={serviceStyles.totalCostAccent} />
        <Text style={serviceStyles.totalCostLabel}>{lang.common.totalProjectCost}</Text>
        <Text style={serviceStyles.totalCostAmount}>
          {formatCurrency(projectSummary.totalProjectCost, selectedLang)}
        </Text>
      </View>

      {/* Tax Disclaimer */}
      <View style={serviceStyles.taxDisclaimerRow} wrap={false}>
        {infoIconBase64 && <Image style={serviceStyles.taxDisclaimerIcon} src={infoIconBase64} />}
        <Text style={serviceStyles.taxDisclaimerText}>{lang.common.taxDisclaimer}</Text>
      </View>

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.projectSummary} position="end" />
    </PageShell>
  );
};

export default ProjectSummaryPage;
