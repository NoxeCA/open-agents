import type { Language } from '../../../locales/loader';

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
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] =
    dateString.split('-').map(Number);
  const monthIndex = month - 1;
  const monthFr = MONTHS_FR[monthIndex];
  const monthEn = MONTHS_EN[monthIndex];

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !monthFr ||
    !monthEn
  ) {
    return dateString;
  }

  if (lang === 'fr') {
    return `${day} ${monthFr} ${year}`;
  }

  return `${monthEn} ${day}, ${year}`;
};

export const formatDateLongWithWeekday = (dateString: string, lang: Language): string => {
  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] =
    dateString.split('-').map(Number);
  const monthIndex = month - 1;
  const monthFr = MONTHS_FR[monthIndex];
  const monthEn = MONTHS_EN[monthIndex];

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !monthFr ||
    !monthEn
  ) {
    return dateString;
  }

  const weekday = new Date(year, month - 1, day).getDay();
  const weekdayFr = WEEKDAYS_FR[weekday];
  const weekdayEn = WEEKDAYS_EN[weekday];

  if (!weekdayFr || !weekdayEn) {
    return dateString;
  }

  if (lang === 'fr') {
    return `${weekdayFr} ${day} ${monthFr} ${year}`;
  }

  return `${weekdayEn}, ${monthEn} ${day}, ${year}`;
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
