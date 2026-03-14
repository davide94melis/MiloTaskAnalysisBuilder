export interface TaskSymbolCatalogEntry {
  library: string;
  key: string;
  label: string;
  glyph: string;
  keywords: readonly string[];
}

export const TASK_SYMBOL_CATALOG: readonly TaskSymbolCatalogEntry[] = [
  {
    library: 'symwriter',
    key: 'tap',
    label: 'Rubinetto',
    glyph: '🚰',
    keywords: ['acqua', 'lavabo', 'bagno']
  },
  {
    library: 'symwriter',
    key: 'soap',
    label: 'Sapone',
    glyph: '🧼',
    keywords: ['igiene', 'lavarsi', 'mani']
  },
  {
    library: 'symwriter',
    key: 'hands',
    label: 'Mani',
    glyph: '👐',
    keywords: ['routine', 'autonomia']
  },
  {
    library: 'symwriter',
    key: 'toothbrush',
    label: 'Spazzolino',
    glyph: '🪥',
    keywords: ['denti', 'igiene']
  },
  {
    library: 'symwriter',
    key: 'towel',
    label: 'Asciugamano',
    glyph: '🧺',
    keywords: ['asciugare', 'bagno']
  },
  {
    library: 'symwriter',
    key: 'chair',
    label: 'Sedia',
    glyph: '🪑',
    keywords: ['sedersi', 'classe']
  },
  {
    library: 'symwriter',
    key: 'book',
    label: 'Libro',
    glyph: '📘',
    keywords: ['lettura', 'scuola']
  },
  {
    library: 'symwriter',
    key: 'snack',
    label: 'Merenda',
    glyph: '🍎',
    keywords: ['cibo', 'pausa']
  }
];
