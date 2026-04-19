import frQuote from './quote/fr.json';
import enQuote from './quote/en.json';

export type Language = 'fr' | 'en';
export type DocumentType = 'quote';

export type QuoteTranslations = typeof frQuote;

const translations = {
  quote: {
    fr: frQuote,
    en: enQuote,
  },
};

export function getTranslations(docType: 'quote', lang: Language): QuoteTranslations;
export function getTranslations(docType: DocumentType, lang: Language): QuoteTranslations {
  return translations[docType][lang];
}
