import i18next from 'i18next';

// Locale bundles are loaded through a glob so the namespace files stay split
// out of the entry chunk. This build ships English only.
const localeModules = import.meta.glob('./locales/*/*.json');

const ns = ['common', 'ribbon', 'preferences', 'dialogs', 'appMenu', 'properties', 'context', 'statusbar'];

// MAPI build: English only. The upstream project ships 39 languages; this
// fork serves a single English-speaking organization, so the other 38 locale
// bundles were removed (moved to DELETED/i18n-locales-non-english/ at the
// repo root if they are ever needed again).
export const LANGUAGES = [
  { code: 'en', name: 'English', englishName: 'English' },
];

// No RTL languages ship in this build. isRTL() is kept so the callers that
// ask about text direction keep working without change.
export const RTL_LANGUAGES = [];

export function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang);
}

function isKnownLanguage(lng) {
  return LANGUAGES.some((l) => l.code === lng);
}

// Fetch all 8 namespace bundles for one language. Missing files are skipped
// (same effect as the language simply not providing that namespace).
async function fetchLocale(lng) {
  const bundles = {};
  await Promise.all(ns.map(async (n) => {
    const importer = localeModules[`./locales/${lng}/${n}.json`];
    if (!importer) return;
    const mod = await importer();
    bundles[n] = mod.default || mod;
  }));
  return bundles;
}

const loadedLanguages = new Set();

// Load a language into i18next on demand. Idempotent; unknown codes no-op.
export async function loadLocale(lng) {
  const base = (lng || '').split('-')[0];
  if (!base || loadedLanguages.has(base) || !isKnownLanguage(base)) return;
  const bundles = await fetchLocale(base);
  Object.entries(bundles).forEach(([n, data]) => {
    i18next.addResourceBundle(base, n, data, true, true);
  });
  loadedLanguages.add(base);
}

const initialResources = { en: await fetchLocale('en') };
loadedLanguages.add('en');

// English-only build: no language detection. Detecting the OS language would
// set i18next.language to a locale we no longer bundle — English strings would
// still render via fallbackLng, but locale-dependent behaviour (text
// direction, digit localisation) would follow the wrong language.
i18next
  .init({
    resources: initialResources,
    lng: 'en',
    ns,
    defaultNS: 'common',
    fallbackLng: 'en',
    showSupportNotice: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
