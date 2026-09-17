export const THEME = Object.freeze({
  storageKey: 'theme',
  light: 'light',
  dark: 'dark',
  linkId: 'theme-link',
});

export const themeHref = (theme) => (
  `${import.meta.env.BASE_URL}themes/lara-${theme}-indigo/theme.css`
);
