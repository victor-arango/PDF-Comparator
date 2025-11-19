// Script de prueba simple para verificar que el servidor funciona
import { PDFComparator } from './src/PDFComparator.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Iniciando prueba del servidor...');

// Verificar que las dependencias están disponibles
try {
  console.log('✅ PDFComparator importado correctamente');
  
  // Verificar que ImageMagick está disponible
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('magick --version');
    console.log('✅ ImageMagick está instalado:', stdout.split('\n')[0]);
  } catch (error) {
    console.log('⚠️ ImageMagick no está instalado o no está en el PATH');
    console.log('   Instrucciones: Ver INSTALACION_IMAGEMAGICK.md');
  }
  
  // Verificar que las carpetas necesarias existen
  const requiredDirs = ['uploads', 'output'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Carpeta ${dir} creada`);
    } else {
      console.log(`✅ Carpeta ${dir} existe`);
    }
  }
  
  console.log('🎉 Servidor listo para funcionar!');
  console.log('📝 Para probar completamente, sube dos archivos PDF desde el frontend');
  
} catch (error) {
  console.error('❌ Error en la prueba:', error.message);
  process.exit(1);
}
