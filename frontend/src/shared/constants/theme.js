import darkThemeUrl from 'primereact/resources/themes/lara-dark-indigo/theme.css?url';
import lightThemeUrl from 'primereact/resources/themes/lara-light-indigo/theme.css?url';

export const THEME = Object.freeze({
  storageKey: 'theme',
  light: 'light',
  dark: 'dark',
  linkId: 'theme-link',
});

const THEME_URLS = Object.freeze({
  [THEME.dark]: darkThemeUrl,
  [THEME.light]: lightThemeUrl,
});

export const themeHref = (theme) => THEME_URLS[theme] ?? THEME_URLS[THEME.light];
