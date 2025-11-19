// Script para verificar si ImageMagick está instalado
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Verificando instalación de ImageMagick...\n');

async function checkImageMagick() {
  try {
    // Intentar con magick (versión nueva)
    console.log('1. Probando comando "magick --version"...');
    const { stdout: magickOutput } = await execAsync('magick --version');
    console.log('✅ ImageMagick está instalado (versión nueva)');
    console.log('📋 Información:', magickOutput.split('\n')[0]);
    return true;
  } catch (magickError) {
    console.log('❌ Comando "magick" no encontrado');
    
    try {
      // Intentar con convert (versión antigua)
      console.log('\n2. Probando comando "convert --version"...');
      const { stdout: convertOutput } = await execAsync('convert --version');
      console.log('✅ ImageMagick está instalado (versión antigua)');
      console.log('📋 Información:', convertOutput.split('\n')[0]);
      return true;
    } catch (convertError) {
      console.log('❌ Comando "convert" no encontrado');
      return false;
    }
  }
}

async function checkCommonPaths() {
  console.log('\n3. Verificando rutas comunes de instalación...');
  
  const commonPaths = [
    'C:\\Program Files\\ImageMagick-7.x.x-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.x.x-Q16\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.x.x-Q16-HDRI\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.x.x-Q16\\magick.exe',
    'C:\\Program Files\\ImageMagick-6.x.x-Q16\\convert.exe',
    'C:\\Program Files (x86)\\ImageMagick-6.x.x-Q16\\convert.exe'
  ];
  
  const fs = await import('fs');
  
  for (const path of commonPaths) {
    try {
      if (fs.existsSync(path)) {
        console.log(`✅ Encontrado en: ${path}`);
        return true;
      }
    } catch (error) {
      // Continuar con la siguiente ruta
    }
  }
  
  console.log('❌ No se encontró ImageMagick en las rutas comunes');
  return false;
}

async function main() {
  const isInstalled = await checkImageMagick();
  
  if (!isInstalled) {
    await checkCommonPaths();
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ ImageMagick NO está instalado o no está en el PATH');
    console.log('='.repeat(60));
    console.log('\n📝 Para instalar ImageMagick:');
    console.log('1. Ve a: https://imagemagick.org/script/download.php#windows');
    console.log('2. Descarga la versión para Windows');
    console.log('3. Instala marcando "Add application directory to your system path"');
    console.log('4. Reinicia la terminal después de la instalación');
    console.log('\n📄 Ver también: INSTALACION_IMAGEMAGICK.md');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('✅ ImageMagick está instalado y funcionando correctamente');
    console.log('='.repeat(60));
    console.log('\n🎉 Tu aplicación PDF Comparator funcionará con conversión completa de imágenes');
  }
}

main().catch(console.error);
