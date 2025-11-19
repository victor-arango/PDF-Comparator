// Script de prueba para verificar la importación de odiff-bin
import { compareImages } from 'odiff-bin';

console.log('✅ Importación de odiff-bin exitosa');
console.log('compareImages es una función:', typeof compareImages === 'function');

// Probar si la función está disponible
if (typeof compareImages === 'function') {
  console.log('🎉 compareImages está disponible y funcionando');
} else {
  console.log('❌ compareImages no está disponible');
}
