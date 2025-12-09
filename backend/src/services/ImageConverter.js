import pdfPoppler from "pdf-poppler";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { FileSystemManager }  from "../utils/FileSystem.js";
import { PDFLoader } from "./PDFLoader.js"; 

export class ImageConverter {
  constructor(config, popplerChecker) {
    this.config = config;
    this.popplerChecker = popplerChecker;
  }

  async convertPDFToImages(pdfPath, outputDir, prefix, pageRange = null) {
    const hasPopppler = await this.popplerChecker.check();
    
    if (hasPopppler) {
      return await this.convertWithPoppler(pdfPath, outputDir, prefix, pageRange);
    } else {
      return await this.createPlaceholders(pdfPath, outputDir, prefix, pageRange);
    }
  }

  async convertWithPoppler(pdfPath, outputDir, prefix, pageRange = null) {
    const imagesDir = path.join(outputDir, "images", prefix);
    await FileSystemManager.ensureDirectory(imagesDir);

    const loader = new PDFLoader();
    const totalPages = await loader.getPageCount(pdfPath);
    
    const startPage = pageRange?.start || 1;
    const endPage = pageRange?.end || totalPages;

    console.log(`🌀 Convirtiendo páginas ${startPage}-${endPage} de ${totalPages} (${prefix})`);

    const options = {
      format: "png",
      out_dir: imagesDir,
      out_prefix: "page",
      first_page: startPage,
      last_page: endPage,
      dpi: this.config.comparison.dpi
    };

    await pdfPoppler.convert(pdfPath, options);

    const imageFiles = [];
    const allFiles = await fs.readdir(imagesDir);
    const pngFiles = allFiles.filter(f => f.toLowerCase().endsWith(".png"));

    for (let i = startPage; i <= endPage; i++) {
      const imagePath = this.findImageFile(imagesDir, pngFiles, i);
      
      if (imagePath && await this.validateImage(imagePath)) {
        imageFiles.push(imagePath);
      } else {
        const placeholderPath = path.join(imagesDir, `page-${i}.png`);
        await this.createPlaceholder(placeholderPath, i);
        imageFiles.push(placeholderPath);
      }
    }

    return imageFiles;
  }

  findImageFile(imagesDir, pngFiles, pageNum) {
    const possibleNames = [
      `page-${pageNum}.png`,
      `page${pageNum}.png`,
      `page_${pageNum}.png`,
      `page-${String(pageNum).padStart(2, "0")}.png`,
      `page${String(pageNum).padStart(2, "0")}.png`,
      `page-${String(pageNum).padStart(3, "0")}.png`
    ];

    for (const name of possibleNames) {
      if (pngFiles.includes(name)) {
        return path.join(imagesDir, name);
      }
    }

    const matchingFile = pngFiles.find(f => {
      const match = f.match(/(\d+)/);
      return match && parseInt(match[1]) === pageNum;
    });

    return matchingFile ? path.join(imagesDir, matchingFile) : null;
  }

  async validateImage(imagePath) {
    const stats = await FileSystemManager.getFileStats(imagePath);
    return stats && stats.size > 0;
  }

  async createPlaceholders(pdfPath, outputDir, prefix, pageRange = null) {
    const imagesDir = path.join(outputDir, "images", prefix);
    await FileSystemManager.ensureDirectory(imagesDir);

    const loader = new PDFLoader();
    const totalPages = await loader.getPageCount(pdfPath);
    
    const startPage = pageRange?.start || 1;
    const endPage = pageRange?.end || totalPages;

    const imageFiles = [];
    for (let i = startPage; i <= endPage; i++) {
      const placeholderPath = path.join(imagesDir, `page-${i}.png`);
      await this.createPlaceholder(placeholderPath, i);
      imageFiles.push(placeholderPath);
    }

    return imageFiles;
  }

  async createPlaceholder(imagePath, pageNum) {
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

    try {
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer).png().toFile(imagePath);
    } catch (error) {
      console.warn(`⚠️ No se pudo crear placeholder PNG para página ${pageNum}`);
    }
  }
}