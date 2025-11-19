/**
 * Configuración centralizada para PDFComparator
 */
export const DEFAULT_CONFIG = {
  // Configuración de comparación
  comparison: {
    threshold: 0.1,
    antialiasing: true,
    dpi: 150,
  },

  // Configuración de resaltado
  highlight: {
    color: { r: 255, g: 0, b: 0 },
    opacity: 0.5,
    blendMode: 'overlay',
  },

  // Configuración de directorios
  directories: {
    output: './output',
    images: 'images',
    diffs: 'diffs',
    highlights: 'highlights',
  },

  // Configuración de Poppler
  poppler: {
    format: 'png',
    outPrefix: 'page',
  },

  // Configuración de placeholder
  placeholder: {
    width: 800,
    height: 1000,
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    textColor: '#9CA3AF',
  },

  // Configuración de reporte
  report: {
    filename: 'comparison_report.html',
    locale: 'es-ES',
  },
};

/**
 * Mensajes de consola
 */
export const MESSAGES = {
  startComparison: '🔍 Iniciando comparación de PDFs...',
  popplerInstalled: '✅ Poppler está instalado',
  popplerNotInstalled: '⚠️ Poppler NO está instalado - usando placeholders',
  convertingPDFs: '🖼️ Convirtiendo PDFs a imágenes...',
  comparingPages: '⚖️ Comparando páginas...',
  reportGenerated: '📊 Reporte generado:',
  pageIdentical: (page) => `  ✅ Página ${page}: Idéntica`,
  pageDifferent: (page, percent) => `  ⚠️ Página ${page}: ${percent}% diferente`,
  pageNotFound: (page) => `  ⚠️ Página ${page}: Imagen no encontrada`,
  highlightCreated: (page) => `    🎨 Resaltado creado para página ${page}`,
  error: (msg) => `❌ Error: ${msg}`,
};

/**
 * Tipos de diferencias
 */
export const DIFF_TYPES = {
  MISSING: 'missing',
  MISSING_IMAGE: 'missing_image',
  DIFFERENT: 'different',
  IDENTICAL: 'identical',
  ERROR: 'error',
};

/**
 * Colores para el reporte HTML
 */
export const REPORT_COLORS = {
  primary: { from: '#667eea', to: '#764ba2' },
  secondary: { from: '#f093fb', to: '#f5576c' },
  success: { from: '#a8edea', to: '#fed6e3' },
  labels: {
    original: '#e74c3c',
    modified: '#3498db',
    diff: '#e67e22',
    highlight: '#9b59b6',
  },
};

/**
 * Valida la configuración del usuario
 * @param {Object} userConfig - Configuración del usuario
 * @returns {Object} Configuración validada
 */
export function validateConfig(userConfig = {}) {
  const config = { ...DEFAULT_CONFIG };

  // Validar threshold
  if (userConfig.threshold !== undefined) {
    if (typeof userConfig.threshold !== 'number' || userConfig.threshold < 0 || userConfig.threshold > 1) {
      throw new Error('threshold debe ser un número entre 0 y 1');
    }
    config.comparison.threshold = userConfig.threshold;
  }

  // Validar DPI
  if (userConfig.dpi !== undefined) {
    if (typeof userConfig.dpi !== 'number' || userConfig.dpi < 72 || userConfig.dpi > 600) {
      throw new Error('dpi debe ser un número entre 72 y 600');
    }
    config.comparison.dpi = userConfig.dpi;
  }

  // Validar color de resaltado
  if (userConfig.highlightColor !== undefined) {
    const { r, g, b } = userConfig.highlightColor;
    if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' ||
        r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('highlightColor debe tener valores r, g, b entre 0 y 255');
    }
    config.highlight.color = userConfig.highlightColor;
  }

  // Validar opacidad
  if (userConfig.highlightOpacity !== undefined) {
    if (typeof userConfig.highlightOpacity !== 'number' || 
        userConfig.highlightOpacity < 0 || userConfig.highlightOpacity > 1) {
      throw new Error('highlightOpacity debe ser un número entre 0 y 1');
    }
    config.highlight.opacity = userConfig.highlightOpacity;
  }

  return config;
}