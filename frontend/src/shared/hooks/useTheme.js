import { useCallback, useEffect, useState } from 'react';
import { THEME, themeHref } from '@/shared/constants/theme';

const readStoredTheme = () => localStorage.getItem(THEME.storageKey) === THEME.dark;

const applyTheme = (isDarkMode) => {
  const themeLink = document.getElementById(THEME.linkId);

  if (themeLink) {
    themeLink.href = themeHref(isDarkMode ? THEME.dark : THEME.light);
  }
};

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(readStoredTheme);

  useEffect(() => applyTheme(isDarkMode), [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((currentTheme) => {
      const nextTheme = !currentTheme;
      localStorage.setItem(THEME.storageKey, nextTheme ? THEME.dark : THEME.light);
      return nextTheme;
    });
  }, []);

  return { isDarkMode, toggleTheme };
};
