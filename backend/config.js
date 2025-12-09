export const CONFIG = {
  comparison: {
    threshold: 0.001,
    dpi: 150,
    antialiasing: true,
    highlightColor: { r: 255, g: 0, b: 0 },
    highlightOpacity: 0.5,
    blendMode: "overlay"
  },
  processing: {
    batchSize: 50, // Procesar 50 páginas a la vez
    maxConcurrent: 5, // Máximo 5 operaciones simultáneas
    timeoutMs: 30000,
    retryAttempts: 3
  },
  paths: {
    output: "./output",
    reports: "./reports",
    uploads: "./uploads",
    tmp: "./tmp"
  },
  puppeteer: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    timeout: 5000
  }
};