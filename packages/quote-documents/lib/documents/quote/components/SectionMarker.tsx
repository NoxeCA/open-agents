import React from 'react';
import { Text } from '@react-pdf/renderer';
import type { PageNumberCollector } from '../shared/pagination';

interface SectionMarkerProps {
  collector: PageNumberCollector;
  sectionKey: string;
  position: 'start' | 'end';
}

/**
 * Invisible element that records its page number into the collector.
 * Place at the start and end of each section.
 * For single-page sections, use position="start" — it sets both start and end.
 */
const SectionMarker: React.FC<SectionMarkerProps> = ({ collector, sectionKey, position }) => (
  <Text
    render={({ pageNumber }) => {
      if (!collector[sectionKey]) {
        collector[sectionKey] = { start: pageNumber, end: pageNumber };
      }
      if (position === 'start') {
        collector[sectionKey].start = pageNumber;
        collector[sectionKey].end = pageNumber;
      }
      if (position === 'end') {
        collector[sectionKey].end = pageNumber;
      }
      return '';
    }}
    style={{ position: 'absolute', fontSize: 0, height: 0, width: 0 }}
  />
);

export default SectionMarker;
