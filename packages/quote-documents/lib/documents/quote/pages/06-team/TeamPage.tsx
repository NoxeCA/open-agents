import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import type { FC } from "react";
import type { QuoteTranslations } from '../../../../locales/loader';
import type { PageNumberCollector } from '../../shared/pagination';
import type { TeamPageData, TeamMember } from './types';
import { SECTION_KEYS } from '../../shared/pagination';
import PageShell from '../../components/PageShell';
import SectionMarker from '../../components/SectionMarker';
import { teamStyles as styles } from './styles';

const SkillPills: FC<{ skills: string[] }> = ({ skills }) => (
  <View style={styles.skillsRow}>
    {skills.slice(0, 3).map((skill, i) => (
      <View key={i} style={styles.skillPill}>
        <Text style={styles.skillText}>{skill}</Text>
      </View>
    ))}
  </View>
);

const MemberCard: FC<{ member: TeamMember }> = ({ member }) => (
  <View style={styles.card} wrap={false}>
    <Text style={styles.role}>{member.role}</Text>
    <Text style={styles.memberName}>{member.name}</Text>
    {member.skills.length > 0 && <SkillPills skills={member.skills} />}
    <Text style={styles.description}>{member.description}</Text>
  </View>
);

interface TeamPageProps {
  data: TeamPageData;
  lang: QuoteTranslations;
  pageHeader: string;
  logoBase64: string;
  arrowsBase64: string;
  pageNumbers: PageNumberCollector;
}

const TeamPage: FC<TeamPageProps> = ({
  data,
  lang,
  pageHeader,
  logoBase64,
  arrowsBase64,
  pageNumbers,
}) => {
  const members = data.team || [];

  return (
    <PageShell pageHeader={pageHeader} logoBase64={logoBase64} arrowsBase64={arrowsBase64}>
      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.team} position="start" />

      <Text style={styles.title}>{lang.team.title}</Text>
      <Text style={styles.intro}>{lang.team.intro}</Text>

      {members.map((member, i) => (
        <MemberCard key={i} member={member} />
      ))}

      <SectionMarker collector={pageNumbers} sectionKey={SECTION_KEYS.team} position="end" />
    </PageShell>
  );
};

export default TeamPage;
