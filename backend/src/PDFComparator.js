import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import pkg from 'odiff-bin';
const { compare: compareImages } = pkg;
import pdfPoppler from 'pdf-poppler';
import sharp from 'sharp';


const REMOVE_OUTPUT = "./output";
const REMOVE_REPORTS = "./reports";
const REMOVE_UPLOADS = "./uploads";

/**
 * Clase para comparar PDFs generando diffs visuales mejorados
 */
export class PDFComparator {
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 0.1,
      dpi: options.dpi || 150,
      antialiasing: options.antialiasing !== false,
      // Nuevas opciones para resaltado
      highlightColor: options.highlightColor || { r: 255, g: 0, b: 0 }, // Rojo
      highlightOpacity: options.highlightOpacity || 0.5,
      blendMode: options.blendMode || 'overlay', // 'overlay', 'multiply', 'screen'
      ...options,
    };
    this.popplerAvailable = null;
  }

  async checkPopplerInstallation() {
    if (this.popplerAvailable !== null) {
      return this.popplerAvailable;
    }

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('pdftoppm -v');
      console.log('✅ Poppler está instalado y disponible');
      this.popplerAvailable = true;
      return true;
    } catch (error) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync('pdfinfo -v');
        console.log('✅ Poppler está instalado (verificado con pdfinfo)');
        this.popplerAvailable = true;
        return true;
      } catch (pdfinfoError) {
        console.log('❌ Poppler NO está instalado');
        this.popplerAvailable = false;
        return false;
      }
    }
  }

  async comparePDFs(originalPath, modifiedPath, outputDir = "./output") {
    return this.compare(originalPath, modifiedPath, outputDir);
  }

  async compare(originalPath, modifiedPath, outputDir = "./output") {
    try {
      console.log("🔍 Iniciando comparación de PDFs...");
      
      const popplerInstalled = await this.checkPopplerInstallation();
      
      if (!popplerInstalled) {
        console.log("⚠️ Continuando con funcionalidad limitada");
      }
      
      this.validateFiles(originalPath, modifiedPath);
      await this.ensureDirectory(outputDir);

      const [originalPdf, modifiedPdf] = await Promise.all([
        this.loadPDF(originalPath),
        this.loadPDF(modifiedPath),
      ]);

      const originalPages = originalPdf.getPageCount();
      const modifiedPages = modifiedPdf.getPageCount();
      const maxPages = Math.max(originalPages, modifiedPages);

      console.log(`📄 Original: ${originalPages} páginas`);
      console.log(`📄 Modificado: ${modifiedPages} páginas`);

      console.log("🖼️ Convirtiendo PDFs a imágenes...");
      const [originalImages, modifiedImages] = await Promise.all([
        this.convertPDFToImages(originalPath, outputDir, "original"),
        this.convertPDFToImages(modifiedPath, outputDir, "modified"),
      ]);

      console.log("⚖️ Comparando páginas...");
      console.log(`  📄 Imágenes originales: ${originalImages.length}`);
      console.log(`  📄 Imágenes modificadas: ${modifiedImages.length}`);
      
      const differences = await this.compareAllPages(
        originalImages,
        modifiedImages,
        outputDir
      );
      
      // Validación: verificar que se hayan procesado todas las páginas
      const processedPages = differences.length;
      if (processedPages !== maxPages) {
        console.warn(`  ⚠️ ADVERTENCIA: Se procesaron ${processedPages} páginas pero se esperaban ${maxPages}`);
      }
      
      // Logging de resumen de diferencias
      const pagesWithDiffs = differences.filter(d => d.hasDifference).length;
      console.log(`  📊 Resumen: ${pagesWithDiffs} de ${processedPages} páginas tienen diferencias`);

      const reportPath = await this.generateReport(differences, outputDir, {
        originalPath,
        modifiedPath,
        originalPages,
        modifiedPages,
      });

      const summary = this.generateSummary(differences, maxPages);
      console.log("\n" + summary);
      console.log(`📊 Reporte generado: ${reportPath}`);

      return {
        success: true,
        differences,
        reportPath,
        summary,
        stats: {
          totalPages: maxPages,
          pagesWithDifferences: differences.filter((d) => d.hasDifference).length,
          identicalPages: differences.filter((d) => !d.hasDifference).length,
        },
      };
    } catch (err) {
      console.error("❌ Error en comparación:", err.message);
      throw err;
    }
  }

  validateFiles(originalPath, modifiedPath) {
    if (!existsSync(originalPath))
      throw new Error(`Archivo no encontrado: ${originalPath}`);
    if (!existsSync(modifiedPath))
      throw new Error(`Archivo no encontrado: ${modifiedPath}`);
  }

  async ensureDirectory(dir) {
    if (!existsSync(dir)) await fs.mkdir(dir, { recursive: true });
  }

  async loadPDF(pdfPath) {
    const bytes = await fs.readFile(pdfPath);
    return await PDFDocument.load(bytes);
  }

  async convertPDFToImages(pdfPath, outputDir, prefix) {
    const popplerInstalled = await this.checkPopplerInstallation();
    
    if (popplerInstalled) {
      return await this.convertPDFToImagesWithPoppler(pdfPath, outputDir, prefix);
    } else {
      return await this.createPlaceholderImages(pdfPath, outputDir, prefix);
    }
  }

  async convertPDFToImagesWithPoppler(pdfPath, outputDir, prefix) {
    const imagesDir = path.join(outputDir, "images", prefix);
    await this.ensureDirectory(imagesDir);

    console.log(`🌀 Generando imágenes para ${prefix} con Poppler...`);
    
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPageCount();

      const imageFiles = [];
      
      const options = {
        format: 'png',
        out_dir: imagesDir,
        out_prefix: 'page',
        page: null, // null = todas las páginas
        // Agregar opciones adicionales para mejor compatibilidad
        first_page: 1,
        last_page: pages,
      };
      
      // Agregar DPI si está configurado
      if (this.options.dpi) {
        options.dpi = this.options.dpi;
      }

      console.log(`  📄 Convirtiendo ${pages} páginas con Poppler...`);
      console.log(`     PDF: ${pdfPath}`);
      console.log(`     Directorio de salida: ${imagesDir}`);
      console.log(`     Prefijo: ${options.out_prefix}`);
      console.log(`     Formato: ${options.format}`);
      
      // Verificar que el PDF existe
      const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
      if (!pdfExists) {
        throw new Error(`El archivo PDF no existe: ${pdfPath}`);
      }
      
      // Verificar que el directorio existe
      const dirExists = await fs.access(imagesDir).then(() => true).catch(() => false);
      if (!dirExists) {
        console.warn(`     ⚠️ El directorio no existe, intentando crearlo...`);
        await this.ensureDirectory(imagesDir);
      }
      
      try {
        await pdfPoppler.convert(pdfPath, options);
        console.log(`     ✅ Conversión completada`);
      } catch (convertError) {
        console.error(`     ❌ Error en la conversión:`, convertError.message);
        console.error(`     Stack:`, convertError.stack);
        throw convertError;
      }
      
      // Listar todos los archivos generados para debugging
      let allFiles = [];
      try {
        allFiles = await fs.readdir(imagesDir);
        console.log(`     Archivos generados en el directorio (${allFiles.length} total):`, allFiles);
      } catch (dirError) {
        console.warn(`     ⚠️ No se pudo leer el directorio:`, dirError.message);
      }
      
      // Filtrar solo archivos PNG
      const pngFiles = allFiles.filter(f => f.toLowerCase().endsWith('.png'));
      console.log(`     Archivos PNG encontrados: ${pngFiles.length}`);
      
      // pdf-poppler puede generar archivos con diferentes formatos de nombre
      // Intentar diferentes variaciones: page-1.png, page1.png, page_1.png, etc.
      for (let i = 1; i <= pages; i++) {
        const possibleNames = [
          `page-${i}.png`,      // page-1.png
          `page${i}.png`,      // page1.png
          `page_${i}.png`,     // page_1.png
          `page-${String(i).padStart(2, '0')}.png`, // page-01.png
          `page${String(i).padStart(2, '0')}.png`,  // page01.png
          `page-${String(i).padStart(3, '0')}.png`, // page-001.png
        ];
        
        let imagePath = null;
        let found = false;
        let foundFileName = null;
        
        // Buscar el archivo con cualquiera de los nombres posibles
        for (const fileName of possibleNames) {
          if (allFiles.includes(fileName)) {
            imagePath = path.join(imagesDir, fileName);
            found = true;
            foundFileName = fileName;
            break;
          }
        }
        
        if (!found && pngFiles.length > 0) {
          // Si no se encontró con nombres esperados, buscar por número en el nombre
          const matchingFile = pngFiles.find(f => {
            // Buscar números en el nombre del archivo
            const match = f.match(/(\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              return num === i;
            }
            return false;
          });
          
          if (matchingFile) {
            imagePath = path.join(imagesDir, matchingFile);
            found = true;
            foundFileName = matchingFile;
            console.log(`    🔍 Página ${i} encontrada con nombre alternativo: ${matchingFile}`);
          }
        }
        
        if (found && imagePath) {
          // Verificar que el archivo realmente existe y tiene contenido
          try {
            const stats = await fs.stat(imagePath);
            if (stats.size > 0) {
              imageFiles.push(imagePath);
              console.log(`    ✓ Página ${i} convertida: ${foundFileName} (${stats.size} bytes)`);
            } else {
              console.warn(`    ⚠️ Página ${i}: archivo encontrado pero está vacío (${foundFileName})`);
              const expectedPath = path.join(imagesDir, `page-${i}.png`);
              await this.createPlaceholderImage(expectedPath, i);
              imageFiles.push(expectedPath);
            }
          } catch (statError) {
            console.warn(`    ⚠️ Página ${i}: error verificando archivo ${foundFileName}:`, statError.message);
            const expectedPath = path.join(imagesDir, `page-${i}.png`);
            await this.createPlaceholderImage(expectedPath, i);
            imageFiles.push(expectedPath);
          }
        } else {
          console.warn(`    ⚠️ Página ${i} no se convirtió - creando placeholder`);
          console.warn(`       Archivos disponibles: ${pngFiles.join(', ') || 'ninguno'}`);
          // Crear placeholder con el nombre esperado
          const expectedPath = path.join(imagesDir, `page-${i}.png`);
          await this.createPlaceholderImage(expectedPath, i);
          imageFiles.push(expectedPath);
        }
      }

      console.log(`  ✓ ${imageFiles.length} imágenes generadas (${prefix})`);
      return imageFiles;
    } catch (error) {
      console.error(`❌ Error con Poppler en ${prefix}:`, error.message);
      return await this.createPlaceholderImages(pdfPath, outputDir, prefix);
    }
  }

  async createPlaceholderImages(pdfPath, outputDir, prefix) {
    const imagesDir = path.join(outputDir, "images", prefix);
    await this.ensureDirectory(imagesDir);

    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = pdf.getPageCount();

    const imageFiles = [];
    for (let i = 1; i <= pages; i++) {
      const placeholderPath = path.join(imagesDir, `page-${i}.png`);
      await this.createPlaceholderImage(placeholderPath, i);
      imageFiles.push(placeholderPath);
    }

    return imageFiles;
  }

  async createPlaceholderImage(imagePath, pageNum) {
    const svgContent = `<svg width="800" height="1000" viewBox="0 0 800 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1000" fill="#F3F4F6"/>
      <rect x="50" y="50" width="700" height="900" fill="white" stroke="#D1D5DB" stroke-width="2"/>
      <text x="400" y="500" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="24">
        Página ${pageNum}
      </text>
      <text x="400" y="550" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="16">
        Placeholder - Instalar Poppler
      </text>
    </svg>`;
    
    // Crear tanto SVG como PNG placeholder
    const svgPath = imagePath.replace('.png', '.svg');
    await fs.writeFile(svgPath, svgContent);
    
    // Convertir SVG a PNG usando sharp si está disponible
    try {
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer)
        .png()
        .toFile(imagePath);
    } catch (error) {
      console.warn(`No se pudo convertir SVG a PNG para página ${pageNum}, solo se guardó SVG`);
    }
  }

  async compareAllPages(originalImages, modifiedImages, outputDir) {
    const diffDir = path.join(outputDir, "diffs");
    const highlightDir = path.join(outputDir, "highlights");
    await this.ensureDirectory(diffDir);
    await this.ensureDirectory(highlightDir);

    const maxPages = Math.max(originalImages.length, modifiedImages.length);
    const results = [];

    for (let i = 0; i < maxPages; i++) {
      const pageNum = i + 1;
      const originalImg = originalImages[i];
      const modifiedImg = modifiedImages[i];

      // Asegurar que siempre tengamos rutas, incluso si las imágenes no existen
      const originalImagePath = originalImg || path.join(outputDir, "images", "original", `page-${pageNum}.png`);
      const modifiedImagePath = modifiedImg || path.join(outputDir, "images", "modified", `page-${pageNum}.png`);
      const diffPath = path.join(diffDir, `diff-page-${pageNum}.png`);
      const highlightPath = path.join(highlightDir, `highlight-page-${pageNum}.png`);

      if (!originalImg || !modifiedImg) {
        // Asegurar que existan los directorios
        await this.ensureDirectory(path.dirname(originalImagePath));
        await this.ensureDirectory(path.dirname(modifiedImagePath));
        
        results.push({
          page: pageNum,
          hasDifference: true,
          type: "missing",
          message: !originalImg
            ? "Página solo existe en PDF modificado"
            : "Página solo existe en PDF original",
          originalImage: originalImagePath,
          modifiedImage: modifiedImagePath,
          diffPath: null,
        });
        continue;
      }

      try {
        const originalExists = await fs.access(originalImg).then(() => true).catch(() => false);
        const modifiedExists = await fs.access(modifiedImg).then(() => true).catch(() => false);
        
        if (!originalExists || !modifiedExists) {
          console.warn(`  ⚠️ Página ${pageNum}: Imagen no encontrada`);
          console.warn(`     Original existe: ${originalExists} - ${originalImg}`);
          console.warn(`     Modified existe: ${modifiedExists} - ${modifiedImg}`);
          results.push({
            page: pageNum,
            hasDifference: true,
            type: "missing_image",
            message: "Imagen no encontrada",
            originalImage: originalImagePath,
            modifiedImage: modifiedImagePath,
            diffPath: null,
          });
          continue;
        }

        // Validar que las imágenes tengan contenido (no estén vacías)
        try {
          const originalStats = await fs.stat(originalImg);
          const modifiedStats = await fs.stat(modifiedImg);
          
          if (originalStats.size === 0 || modifiedStats.size === 0) {
            console.warn(`  ⚠️ Página ${pageNum}: Imagen vacía detectada`);
            console.warn(`     Original size: ${originalStats.size} bytes`);
            console.warn(`     Modified size: ${modifiedStats.size} bytes`);
          }
        } catch (statError) {
          console.warn(`  ⚠️ Página ${pageNum}: Error obteniendo estadísticas de imágenes:`, statError.message);
        }

        // Comparación con odiff
        // IMPORTANTE: Usar threshold muy bajo (0.001 = 0.1%) para detectar cualquier diferencia
        // odiff-bin threshold es un valor entre 0-1 que representa la diferencia de color permitida
        const odiffThreshold = Math.min(this.options.threshold, 0.001); // Máximo 0.1% de tolerancia
        
        console.log(`  🔍 Comparando página ${pageNum}...`);
        console.log(`     Threshold usado: ${odiffThreshold} (${(odiffThreshold * 100).toFixed(3)}%)`);
        
        const result = await compareImages(originalImg, modifiedImg, diffPath, {
          threshold: odiffThreshold,
          antialiasing: this.options.antialiasing,
          outputDiffMask: true,
        });

        // Logging detallado del resultado completo
        console.log(`  📋 Resultado odiff para página ${pageNum}:`, JSON.stringify({
          match: result.match,
          diffPercentage: result.diffPercentage,
          difference: result.difference,
          threshold: odiffThreshold,
          // Incluir todas las propiedades del resultado
          ...result
        }, null, 2));

        // odiff-bin: result.match es false si hay diferencias detectadas
        // Esta es la fuente de verdad principal
        const hasDifference = result.match === false;
        
        // Calcular diffPercentage correctamente
        let diffPercentage = 0;
        if (result.diffPercentage !== undefined && result.diffPercentage !== null) {
          let percentage = typeof result.diffPercentage === 'number' 
            ? result.diffPercentage
            : parseFloat(result.diffPercentage) || 0;
          
          // odiff-bin devuelve diffPercentage como decimal (0-1) o porcentaje (0-100)
          // Verificar el rango para determinar el formato
          if (percentage > 1 && percentage <= 100) {
            // Ya está en porcentaje (0-100)
            diffPercentage = percentage;
          } else if (percentage > 100) {
            // Dividir por 100 si es > 100 (probable error de escala)
            diffPercentage = percentage / 100;
          } else if (percentage > 0 && percentage <= 1) {
            // Está en decimal (0-1), convertir a porcentaje
            diffPercentage = percentage * 100;
          } else {
            // Si es 0 o negativo, mantener en 0
            diffPercentage = 0;
          }
          
          // Limitar entre 0 y 100
          diffPercentage = Math.min(Math.max(diffPercentage, 0), 100);
        }

        // VALIDACIÓN CRÍTICA: Si result.match es false, SIEMPRE hay diferencia
        // No importa el diffPercentage, si match es false, hay diferencia
        if (hasDifference && diffPercentage === 0) {
          console.warn(`  ⚠️ ADVERTENCIA: Página ${pageNum} tiene match=false pero diffPercentage=0. Forzando detección de diferencia.`);
          diffPercentage = 0.01; // Asignar un valor mínimo para indicar diferencia
        }
        
        console.log(`  📊 Página ${pageNum} - Resultado final:`);
        console.log(`     Match: ${result.match}`);
        console.log(`     DiffPercentage (raw): ${result.diffPercentage}`);
        console.log(`     DiffPercentage (normalizado): ${diffPercentage.toFixed(4)}%`);
        console.log(`     HasDifference: ${hasDifference}`);

        // VALIDACIÓN: Verificar que el diffPath se haya generado
        // odiff-bin siempre genera el diffPath si hay diferencias (match=false)
        const diffExists = await fs.access(diffPath).then(() => true).catch(() => false);
        
        if (hasDifference) {
          if (!diffExists) {
            console.error(`  ❌ ERROR: Página ${pageNum} tiene match=false pero diffPath no existe en: ${diffPath}`);
            console.error(`     Esto indica un problema con odiff-bin. Verificar que las imágenes sean válidas.`);
          } else {
            console.log(`  ✅ Diff generado correctamente para página ${pageNum}`);
            
            // Crear imagen con resaltado mejorado
            try {
              await this.createEnhancedHighlight(
                originalImg,
                modifiedImg,
                diffPath,
                highlightPath,
                pageNum
              );
            } catch (highlightError) {
              console.warn(`  ⚠️ Error creando highlight para página ${pageNum}:`, highlightError.message);
            }
          }
        } else {
          // Si no hay diferencia pero el diff existe, puede ser un falso negativo
          if (diffExists) {
            const diffStats = await fs.stat(diffPath);
            if (diffStats.size > 0) {
              console.warn(`  ⚠️ ADVERTENCIA: Página ${pageNum} tiene match=true pero diffPath existe y tiene contenido (${diffStats.size} bytes)`);
              console.warn(`     Esto puede indicar un falso negativo. Revisar threshold.`);
            }
          }
        }

        // CRITERIO FINAL: Si match es false, SIEMPRE marcar como diferencia
        // No usar diffPercentage como criterio principal, solo como información adicional
        const shouldIncludeDiff = hasDifference;

        // Asegurar que diffPath se incluya si existe y hay diferencia
        const finalDiffPath = (hasDifference && diffExists) ? diffPath : null;
        const finalHighlightPath = (hasDifference && diffExists) ? highlightPath : null;

        results.push({
          page: pageNum,
          hasDifference: hasDifference,
          diffPercentage: parseFloat(diffPercentage.toFixed(2)),
          diffPath: finalDiffPath,
          highlightPath: finalHighlightPath,
          originalImage: originalImg,
          modifiedImage: modifiedImg,
          // Asegurar que siempre tengamos rutas SVG como fallback
          originalImageSvg: originalImg ? originalImg.replace('.png', '.svg') : null,
          modifiedImageSvg: modifiedImg ? modifiedImg.replace('.png', '.svg') : null,
          diffPathSvg: finalDiffPath ? finalDiffPath.replace('.png', '.svg') : null,
        });

        // Logging final claro
        if (hasDifference) {
          console.log(`  ⚠️ Página ${pageNum}: DIFERENCIA DETECTADA - ${diffPercentage.toFixed(2)}% diferente`);
          console.log(`     ✅ DiffPath: ${finalDiffPath ? 'Generado' : 'NO generado'}`);
        } else {
          console.log(`  ✓ Página ${pageNum}: Idéntica (${diffPercentage.toFixed(4)}% diferencia)`);
        }
        console.log(`  ──────────────────────────────────────────`);
      } catch (err) {
        console.error(`  ❌ Error en página ${pageNum}:`, err.message);
        results.push({
          page: pageNum,
          hasDifference: true,
          error: err.message,
          originalImage: originalImg || originalImagePath,
          modifiedImage: modifiedImg || modifiedImagePath,
          diffPath: null,
          originalImageSvg: originalImg ? originalImg.replace('.png', '.svg') : null,
          modifiedImageSvg: modifiedImg ? modifiedImg.replace('.png', '.svg') : null,
        });
      }
    }

    return results;
  }

  /**
   * 🎨 Crea imagen con resaltado mejorado de diferencias
   */
  async createEnhancedHighlight(originalImg, modifiedImg, diffPath, highlightPath, pageNum) {
    try {
      // Cargar imágenes con sharp
      const [original, modified, diff] = await Promise.all([
        sharp(originalImg).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
        sharp(modifiedImg).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
        sharp(diffPath).raw().toBuffer({ resolveWithObject: true })
      ]);

      const { width, height } = original.info;
      const channels = original.info.channels;

      // Crear buffer para imagen resaltada
      const highlighted = Buffer.alloc(width * height * 4); // RGBA

      // Procesar píxeles
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const diffIdx = (y * width + x) * diff.info.channels;

          // Verificar si hay diferencia en este píxel (el diff es blanco donde hay diferencias)
          const isDiff = diff.data[diffIdx] > 128; // Umbral para considerar diferencia

          if (isDiff) {
            // Aplicar color de resaltado
            highlighted[idx] = this.options.highlightColor.r;
            highlighted[idx + 1] = this.options.highlightColor.g;
            highlighted[idx + 2] = this.options.highlightColor.b;
            highlighted[idx + 3] = Math.round(this.options.highlightOpacity * 255);
          } else {
            // Mantener imagen original con transparencia
            highlighted[idx] = original.data[idx];
            highlighted[idx + 1] = original.data[idx + 1];
            highlighted[idx + 2] = original.data[idx + 2];
            highlighted[idx + 3] = channels === 4 ? original.data[idx + 3] : 255;
          }
        }
      }

      // Guardar imagen resaltada
      await sharp(highlighted, {
        raw: {
          width,
          height,
          channels: 4
        }
      })
      .png()
      .toFile(highlightPath);

      console.log(`    🎨 Resaltado creado para página ${pageNum}`);
    } catch (error) {
      console.error(`    ❌ Error creando resaltado para página ${pageNum}:`, error.message);
      // Fallback: copiar diff original
      await fs.copyFile(diffPath, highlightPath);
    }
  }

  generateSummary(differences, totalPages) {
    const withDiff = differences.filter((d) => d.hasDifference).length;
    const identical = differences.filter((d) => !d.hasDifference).length;

    let s = "═══════════════════════════════════\n";
    s += "       RESUMEN DE COMPARACIÓN\n";
    s += "═══════════════════════════════════\n";
    s += `Total de páginas: ${totalPages}\n`;
    s += `Páginas idénticas: ${identical}\n`;
    s += `Páginas con diferencias: ${withDiff}\n`;
    s += "═══════════════════════════════════";
    return s;
  }

  async generateReport(differences, outputDir, metadata) {
    const reportPath = path.join(outputDir, "comparison_report.html");
    const withDiff = differences.filter((d) => d.hasDifference);
    const identical = differences.filter((d) => !d.hasDifference);

    const html =`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Comparación de PDFs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --background: oklch(0.99 0 0);
      --foreground: oklch(0.2 0.015 240);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.2 0.015 240);
      --primary: oklch(0.4 0.12 245);
      --primary-foreground: oklch(0.99 0 0);
      --secondary: oklch(0.97 0.003 240);
      --secondary-foreground: oklch(0.3 0.015 240);
      --muted: oklch(0.965 0.003 240);
      --muted-foreground: oklch(0.48 0.015 240);
      --accent: oklch(0.68 0.2 50);
      --accent-foreground: oklch(0.99 0 0);
      --success: oklch(0.65 0.18 155);
      --success-foreground: oklch(0.99 0 0);
      --warning: oklch(0.7 0.18 70);
      --warning-foreground: oklch(0.2 0.015 240);
      --border: oklch(0.9 0.003 240);
      --radius: 0.75rem;
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      line-height: 1.6;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    
    .container { 
      max-width: 1400px; 
      margin: 0 auto;
    }
    
    .header {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    .header-content {
      display: flex;
      align-items: start;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .header-icon {
      width: 3rem;
      height: 3rem;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .header h1 { 
      color: hsl(var(--foreground));
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    .header-meta {
      color: hsl(var(--muted-foreground));
      font-size: 0.875rem;
      padding: 0.75rem;
      background: hsl(var(--muted) / 0.3);
      border-radius: calc(var(--radius) - 2px);
      border-left: 3px solid hsl(var(--primary));
    }
    
    .header-meta p {
      margin: 0.25rem 0;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .summary-card {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      padding: 1.5rem;
      transition: all 0.2s ease;
    }
    
    .summary-card:hover {
      border-color: hsl(var(--primary) / 0.5);
      box-shadow: 0 4px 12px hsl(var(--primary) / 0.1);
    }
    
    .summary-card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.5rem;
    }
    
    .summary-card-label {
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 600;
      color: hsl(var(--muted-foreground));
      letter-spacing: 0.05em;
    }
    
    .summary-card-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: calc(var(--radius) - 2px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .summary-card-icon.primary { background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); }
    .summary-card-icon.warning { background: hsl(var(--warning) / 0.1); color: hsl(var(--warning)); }
    .summary-card-icon.success { background: hsl(var(--success) / 0.1); color: hsl(var(--success)); }
    
    .summary-card-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: hsl(var(--foreground));
      line-height: 1;
      margin: 0.5rem 0;
    }
    
    .summary-card-description {
      font-size: 0.875rem;
      color: hsl(var(--muted-foreground));
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid hsl(var(--border));
    }
    
    .section-title-icon {
      width: 2.5rem;
      height: 2.5rem;
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .section-title h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
    
    .no-differences {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--success) / 0.3);
      border-radius: var(--radius);
      padding: 3rem 2rem;
      text-align: center;
      margin: 2rem 0;
    }
    
    .no-differences-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .no-differences-icon {
      width: 4rem;
      height: 4rem;
      background: hsl(var(--success) / 0.1);
      color: hsl(var(--success));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .no-differences h2 {
      color: hsl(var(--foreground));
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .no-differences p {
      color: hsl(var(--muted-foreground));
      font-size: 0.938rem;
      line-height: 1.5;
    }
    
    .page-comparison {
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 2rem;
    }
    
    .page-header {
      background: hsl(var(--muted) / 0.5);
      border-bottom: 1px solid hsl(var(--border));
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-header-title {
      font-size: 1rem;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
    
    .page-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      background: hsl(var(--warning) / 0.1);
      color: hsl(var(--warning));
      border-radius: calc(var(--radius) - 2px);
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
    }
    
    .image-container {
      background: hsl(var(--muted) / 0.2);
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .image-container:hover {
      border-color: hsl(var(--primary) / 0.5);
      box-shadow: 0 4px 12px hsl(var(--primary) / 0.1);
    }
    
    .image-label {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
      border-bottom: 1px solid hsl(var(--border));
    }
    
    .image-label.original { 
      background: hsl(var(--destructive) / 0.1); 
      color: hsl(var(--destructive)); 
    }
    
    .image-label.modified { 
      background: hsl(var(--primary) / 0.1); 
      color: hsl(var(--primary)); 
    }
    
    .image-label.diff { 
      background: hsl(var(--warning) / 0.1); 
      color: hsl(var(--warning)); 
    }
    
    .image-label.highlight { 
      background: hsl(var(--accent) / 0.1); 
      color: hsl(var(--accent-foreground)); 
    }
    
    .image-container img {
      width: 100%;
      display: block;
      cursor: zoom-in;
      background: hsl(var(--background));
    }
    
    .diff-info {
      background: hsl(var(--warning) / 0.1);
      border-left: 3px solid hsl(var(--warning));
      padding: 1rem 1.5rem;
      margin: 1.5rem;
      border-radius: calc(var(--radius) - 2px);
      color: hsl(var(--foreground));
      font-size: 0.875rem;
    }
    
    .diff-info strong {
      color: hsl(var(--warning));
      font-weight: 600;
    }
    
    .timestamp {
      text-align: center;
      color: hsl(var(--muted-foreground));
      font-size: 0.875rem;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid hsl(var(--border));
    }
    
    /* Modal para zoom */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      cursor: zoom-out;
      backdrop-filter: blur(4px);
    }
    
    .modal img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 95%;
      max-height: 95%;
      border-radius: var(--radius);
    }
    
    .modal-close {
      position: absolute;
      top: 1.5rem;
      right: 2rem;
      color: white;
      font-size: 2.5rem;
      font-weight: 300;
      cursor: pointer;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .modal-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    @media (max-width: 768px) {
      body { padding: 1rem 0.5rem; }
      .header { padding: 1.5rem 1rem; }
      .header h1 { font-size: 1.5rem; }
      .summary { grid-template-columns: 1fr; gap: 1rem; }
      .images-grid { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <div class="header-icon">📊</div>
        <div style="flex: 1;">
          <h1>Reporte de Comparación de PDFs</h1>
        </div>
      </div>
      <div class="header-meta">
        <p><strong>Original:</strong> ${path.basename(metadata.originalPath)} (${metadata.originalPages} páginas)</p>
        <p><strong>Modificado:</strong> ${path.basename(metadata.modifiedPath)} (${metadata.modifiedPages} páginas)</p>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="summary-card-header">
          <div>
            <div class="summary-card-label">Páginas</div>
          </div>
          <div class="summary-card-icon primary">📄</div>
        </div>
        <div class="summary-card-value">${Math.max(metadata.originalPages, metadata.modifiedPages)}</div>
        <div class="summary-card-description">Total analizadas</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-card-header">
          <div>
            <div class="summary-card-label">Diferencias</div>
          </div>
          <div class="summary-card-icon warning">⚠️</div>
        </div>
        <div class="summary-card-value">${withDiff.length}</div>
        <div class="summary-card-description">Cambios detectados</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-card-header">
          <div>
            <div class="summary-card-label">Idénticas</div>
          </div>
          <div class="summary-card-icon success">✓</div>
        </div>
        <div class="summary-card-value">${identical.length}</div>
        <div class="summary-card-description">Sin cambios</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-card-header">
          <div>
            <div class="summary-card-label">Estado</div>
          </div>
          <div class="summary-card-icon ${withDiff.length === 0 ? 'success' : 'warning'}">
            ${withDiff.length === 0 ? '✓' : '⚠️'}
          </div>
        </div>
        <div class="summary-card-value" style="font-size: 1.5rem;">
          ${withDiff.length === 0 ? 'Idénticos' : 'Diferentes'}
        </div>
        <div class="summary-card-description">
          ${withDiff.length === 0 ? 'Sin cambios' : 'Con modificaciones'}
        </div>
      </div>
    </div>

    ${withDiff.length === 0 ? `
      <div class="no-differences">
        <div class="no-differences-content">
          <div class="no-differences-icon">✓</div>
          <div style="text-align: left;">
            <h2>Los PDFs son completamente idénticos</h2>
            <p>No se encontraron diferencias entre los documentos analizados.</p>
          </div>
        </div>
      </div>
    ` : `
      <div class="section-title">
        <div class="section-title-icon">🔍</div>
        <h2>Páginas con Diferencias</h2>
      </div>
      
      ${withDiff.map(d => `
        <div class="page-comparison">
          <div class="page-header">
            <span class="page-header-title">Página ${d.page}</span>
            ${d.diffPercentage !== undefined && d.diffPercentage !== null ? `
              <span class="page-header-badge">
                ${typeof d.diffPercentage === 'number' ? d.diffPercentage.toFixed(2) : d.diffPercentage}% diferente
              </span>
            ` : ''}
          </div>
          
          <div class="images-grid">
            <div class="image-container">
              <div class="image-label original">PDF Original</div>
              <img src="${d.originalImage ? path.relative(outputDir, d.originalImage) : '#'}" 
                   alt="Página ${d.page} Original" 
                   onclick="openModal(this.src)">
            </div>
            
            <div class="image-container">
              <div class="image-label modified">PDF Modificado</div>
              <img src="${d.modifiedImage ? path.relative(outputDir, d.modifiedImage) : '#'}" 
                   alt="Página ${d.page} Modificado"
                   onclick="openModal(this.src)">
            </div>
            
            ${d.highlightPath ? `
            <div class="image-container">
              <div class="image-label highlight">Diferencias Resaltadas</div>
              <img src="${path.relative(outputDir, d.highlightPath)}" 
                   alt="Diferencias resaltadas página ${d.page}"
                   onclick="openModal(this.src)">
            </div>
            ` : ''}
            
            ${d.diffPath ? `
            <div class="image-container">
              <div class="image-label diff">Mapa de Diferencias</div>
              <img src="${path.relative(outputDir, d.diffPath)}" 
                   alt="Diferencias página ${d.page}"
                   onclick="openModal(this.src)">
            </div>
            ` : ''}
          </div>
          
          ${d.message || d.error ? `
          <div class="diff-info">
            ${d.message || d.error}
          </div>
          ` : ''}
        </div>
      `).join('')}
    `}

    <div class="timestamp">
      Reporte generado el ${new Date().toLocaleString('es-ES', { 
        dateStyle: 'long', 
        timeStyle: 'medium' 
      })}
    </div>
  </div>

  <div id="imageModal" class="modal" onclick="closeModal()">
    <span class="modal-close">&times;</span>
    <img id="modalImage" src="/placeholder.svg" alt="Imagen ampliada">
  </div>

  <script>
    function openModal(src) {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      modal.style.display = 'block';
      modalImg.src = src;
    }

    function closeModal() {
      document.getElementById('imageModal').style.display = 'none';
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;;

    await fs.writeFile(reportPath, html, "utf8");
    return reportPath;
  }

  async clearFolders() {
  const folders = [REMOVE_OUTPUT, REMOVE_REPORTS, REMOVE_UPLOADS];

  for (const folder of folders) {
    try {
      const files = await fs.readdir(folder);
      
      const unlinkPromises = files.map(async (file) => {
        const filePath = path.join(folder, file);
        const stat = await fs.lstat(filePath);
        if (stat.isDirectory()) {
          // Elimina el subdirectorio completo
          await fs.rm(filePath, { recursive: true, force: true });
        } else {
          // Elimina archivo individual
          await fs.unlink(filePath);
        }
      });

      await Promise.all(unlinkPromises);
      console.log(`✅ Carpeta limpiada: ${folder}`);
    } catch (err) {
      console.error(`❌ Error limpiando ${folder}:`, err.message);
    }
  }
}

}