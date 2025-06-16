import { useTranslation } from 'react-i18next';

export function useLanguage() {
  const { t, i18n } = useTranslation();
  
  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en';
  const isChinese = currentLanguage === 'zh';

  const changeLanguage = (lang: 'en' | 'zh') => {
    i18n.changeLanguage(lang);
  };

  const toggleLanguage = () => {
    const newLang = isEnglish ? 'zh' : 'en';
    changeLanguage(newLang);
  };

  return {
    t,
    currentLanguage,
    isEnglish,
    isChinese,
    changeLanguage,
    toggleLanguage
  };
}