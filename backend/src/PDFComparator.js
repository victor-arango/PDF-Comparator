import { EventEmitter } from "./utils/EventEmitter.js";
import { CONFIG } from "../config.js";
import { PopplerChecker } from "../src/services/PopplerChecker.js";
import { ImageComparator } from "../src/services/ImageComparator.js";
import { ReportGenerator } from "../src/services/ReportGenerator.js";
import { BatchProcessor } from "../src/services/BatchProcessor.js";
import { PDFLoader } from "./services/PDFLoader.js";
import { ImageConverter } from "../src/services/ImageConverter.js";
import { FileSystemManager } from "./utils/FileSystem.js";
import path from "path";

export class PDFComparator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = { ...CONFIG, ...options };
    
    // Servicios
    this.popplerChecker = new PopplerChecker();
    this.pdfLoader = new PDFLoader();
    this.imageConverter = new ImageConverter(this.config, this.popplerChecker);
    this.imageComparator = new ImageComparator(this.config);
    this.reportGenerator = new ReportGenerator();
    this.batchProcessor = new BatchProcessor(
      this.config.processing.batchSize,
      this.config.processing.maxConcurrent
    );

    // Reenviar eventos del batch processor
    this.batchProcessor.on("batchStart", data => this.emit("batchStart", data));
    this.batchProcessor.on("batchComplete", data => this.emit("batchComplete", data));
  }

  async compare(originalPath, modifiedPath, outputDir = "./output") {
    try {
      console.log("🔍 Iniciando comparación de PDFs...");
      
      // Validación
      FileSystemManager.validateFile(originalPath);
      FileSystemManager.validateFile(modifiedPath);
      await FileSystemManager.ensureDirectory(outputDir);

      // Cargar metadatos
      const [originalMeta, modifiedMeta] = await Promise.all([
        this.pdfLoader.getMetadata(originalPath),
        this.pdfLoader.getMetadata(modifiedPath)
      ]);

      const maxPages = Math.max(originalMeta.pageCount, modifiedMeta.pageCount);
      console.log(`📄 Original: ${originalMeta.pageCount} páginas`);
      console.log(`📄 Modificado: ${modifiedMeta.pageCount} páginas`);

      // Conversión a imágenes
      console.log("🖼️ Convirtiendo PDFs a imágenes...");
      const [originalImages, modifiedImages] = await Promise.all([
        this.imageConverter.convertPDFToImages(originalPath, outputDir, "original"),
        this.imageConverter.convertPDFToImages(modifiedPath, outputDir, "modified")
      ]);

      // Comparación por lotes
      console.log("⚖️ Comparando páginas en lotes...");
      const differences = await this.comparePagesBatch(
        originalImages,
        modifiedImages,
        outputDir
      );

      // Generación de reporte
      const reportPath = await this.reportGenerator.generate(differences, outputDir, {
        originalPath,
        modifiedPath,
        originalPages: originalMeta.pageCount,
        modifiedPages: modifiedMeta.pageCount
      });

      const summary = this.reportGenerator.generateSummary(differences, maxPages);
      console.log("\n" + summary);
      console.log(`📊 Reporte generado: ${reportPath}`);

      return {
        success: true,
        differences,
        reportPath,
        summary,
        stats: {
          totalPages: maxPages,
          pagesWithDifferences: differences.filter(d => d.hasDifference).length,
          identicalPages: differences.filter(d => !d.hasDifference).length
        }
      };
    } catch (err) {
      console.error("❌ Error en comparación:", err.message);
      throw err;
    }
  }

  async comparePagesBatch(originalImages, modifiedImages, outputDir) {
    const diffDir = path.join(outputDir, "diffs");
    const highlightDir = path.join(outputDir, "highlights");
    await FileSystemManager.ensureDirectory(diffDir);
    await FileSystemManager.ensureDirectory(highlightDir);

    const maxPages = Math.max(originalImages.length, modifiedImages.length);
    const pageIndices = Array.from({ length: maxPages }, (_, i) => i);

    const results = await this.batchProcessor.process(
      pageIndices,
      async (pageIndex, _) => {
        return await this.compareSinglePage(
          pageIndex,
          originalImages,
          modifiedImages,
          diffDir,
          highlightDir,
          outputDir
        );
      }
    );

    return results;
  }

  async compareSinglePage(pageIndex, originalImages, modifiedImages, diffDir, highlightDir, outputDir) {
    const pageNum = pageIndex + 1;
    const originalImg = originalImages[pageIndex];
    const modifiedImg = modifiedImages[pageIndex];

    const originalImagePath = originalImg || path.join(outputDir, "images", "original", `page-${pageNum}.png`);
    const modifiedImagePath = modifiedImg || path.join(outputDir, "images", "modified", `page-${pageNum}.png`);
    const diffPath = path.join(diffDir, `diff-page-${pageNum}.png`);

    if (!originalImg || !modifiedImg) {
      return {
        page: pageNum,
        hasDifference: true,
        type: "missing",
        message: !originalImg ? "Página solo existe en PDF modificado" : "Página solo existe en PDF original",
        originalImage: originalImagePath,
        modifiedImage: modifiedImagePath,
        diffPath: null
      };
    }

    try {
      const comparison = await this.imageComparator.compare(originalImg, modifiedImg, diffPath);
      
      return {
        page: pageNum,
        hasDifference: !comparison.match,
        type: comparison.match ? "identical" : "different",
        diffPercentage: comparison.diffPercentage,
        originalImage: originalImagePath,
        modifiedImage: modifiedImagePath,
        diffPath: comparison.match ? null : diffPath
      };
    } catch (error) {
      console.warn(`⚠️ Error comparando página ${pageNum}:`, error.message);
      return {
        page: pageNum,
        hasDifference: true,
        type: "error",
        message: `Error: ${error.message}`,
        originalImage: originalImagePath,
        modifiedImage: modifiedImagePath,
        diffPath: null
      };
    }
  }

  // Alias para compatibilidad
  async comparePDFs(originalPath, modifiedPath, outputDir = "./output") {
    return this.compare(originalPath, modifiedPath, outputDir);
  }
}
