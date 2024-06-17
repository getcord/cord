import type { Translations } from '@cord-sdk/types';
import { translationResources } from '@cord-sdk/types';
import dayjs from 'dayjs';
// eslint-disable-next-line no-restricted-imports
import type { i18n } from 'i18next';
// eslint-disable-next-line no-restricted-imports
import { createInstance } from 'i18next';
import { ALL_LOCALES, loadLocale } from './dayjs.js';

export function createI18n() {
  const i18n = createInstance();

  void i18n.init({
    resources: translationResources,
    lng: 'en', // Use language 'en' if none other specified
    fallbackLng: 'en', // Use the string from 'en' if the specified language doesn't have one
    interpolation: {
      // Turned off because i18next-react does escaping for us
      escapeValue: false,
    },
  });

  return i18n;
}

async function tryDayJsLocaleSwitch(locale: string) {
  if (dayjs.locale() === locale) {
    // We're already using this locale, we don't need to do anything
    return true;
  }
  if (!ALL_LOCALES.includes(locale)) {
    return false;
  }
  await loadLocale(locale);
  try {
    dayjs.locale(locale);
    return true;
  } catch {
    return false;
  }
}

async function loadDayjsLocale(lang: string) {
  const segments = lang.toLowerCase().split('-');
  if (segments[0] === 'no') {
    // Norwegian has two written forms, Norwegian Bokmål and Norwegian Nynorsk,
    // which are pretty much interchangeable for our purposes and the user's
    // browser might be set to either.  dayjs only supplies translations for
    // Norwegian Bokmål, so use that for translating Norwegian Nynorsk.
    segments[0] = 'nb';
  }
  // dayjs supplies some region- or script-specific translations, so try to find
  // one of those if requested, and fall back to the base language if not
  if (segments.length > 1) {
    if (await tryDayJsLocaleSwitch(`${segments[0]}-${segments[1]}`)) {
      return;
    }
  }
  if (await tryDayJsLocaleSwitch(segments[0])) {
    return;
  }
  // We couldn't load the requested language, so set dayjs to English as a
  // fallback
  dayjs.locale('en');
}

export function addTranslations(
  i18n: i18n,
  translations: Translations | undefined,
  language: string,
) {
  if (translations) {
    for (const lng in translations) {
      let ns: keyof (typeof translations)[string];
      for (ns in translations[lng]) {
        // The final two `true` arguments say to merge these values into the
        // existing values rather than replacing them, so the caller can supply
        // a subset of translations and we'll continue to use our own for the
        // others
        i18n.addResourceBundle(lng, ns, translations[lng][ns], true, true);
      }
    }
  }
  // i18next doesn't apply new resources until you call `changeLanguage`, so
  // always call it even if the language didn't change.
  void i18n.changeLanguage(language);
  void loadDayjsLocale(language);
}
