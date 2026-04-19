import type { Language } from '@/lib/locales/loader';

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS_FR = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
];

const WEEKDAYS_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const formatDateLong = (dateString: string, lang: Language): string => {
  const [year, month, day] = dateString.split('-').map(Number);

  if (lang === 'fr') {
    return `${day} ${MONTHS_FR[month - 1]} ${year}`;
  }

  return `${MONTHS_EN[month - 1]} ${day}, ${year}`;
};

export const formatDateLongWithWeekday = (dateString: string, lang: Language): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();

  if (lang === 'fr') {
    return `${WEEKDAYS_FR[weekday]} ${day} ${MONTHS_FR[month - 1]} ${year}`;
  }

  return `${WEEKDAYS_EN[weekday]}, ${MONTHS_EN[month - 1]} ${day}, ${year}`;
};

export const formatCurrency = (amount: number, lang: Language): string => {
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (lang === 'fr') {
    return `${formatted} $`;
  }
  return `$${formatted}`;
};

export const formatNumber = (amount: number, lang: Language): string => {
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
