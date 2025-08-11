import * as Localization from 'expo-localization'; // Sử dụng expo-localization
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

// Lấy ngôn ngữ thiết bị bằng Localization
const locales = Localization.getLocales();
const deviceLanguage = locales[0]?.languageCode || 'en';

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  resources: {
    en: {translation: en},
    vi: {translation: vi},
  },
  interpolation: {escapeValue: false},
});

export default i18n;