export const MARKDOWN_PALETTES = {
  corporate: { label: 'Corporativa', title: '#1F4E78', table: '#1F4E78', stripe: '#F2F2F2' },
  ocean: { label: 'Océano', title: '#075985', table: '#0284C7', stripe: '#E0F2FE' },
  forest: { label: 'Bosque', title: '#166534', table: '#15803D', stripe: '#DCFCE7' },
  sunset: { label: 'Atardecer', title: '#9A3412', table: '#EA580C', stripe: '#FFEDD5' },
  violet: { label: 'Violeta', title: '#5B21B6', table: '#7C3AED', stripe: '#EDE9FE' },
  monochrome: { label: 'Monocromática', title: '#27272A', table: '#3F3F46', stripe: '#F4F4F5' }
};

export const DEFAULT_MARKDOWN_THEME = {
  ...MARKDOWN_PALETTES.corporate,
  palette: 'corporate',
  fontFamily: 'Arial',
  bodySize: 9.5,
  titleSize: 20,
  headingSize: 15,
  headerText: 'CORPORACIÓN LINKER  |  DOCUMENTO',
  showPageNumbers: true
};
