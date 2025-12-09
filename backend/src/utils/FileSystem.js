import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export class FileSystemManager {
  static async ensureDirectory(dir) {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  static validateFile(filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
  }

  static async cleanupDirectory(dir, keepStructure = false) {
    if (!existsSync(dir)) return;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.cleanupDirectory(fullPath);
          if (!keepStructure) await fs.rmdir(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Error limpiando ${dir}:`, err.message);
    }
  }

  static async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch {
      return null;
    }
  }
}
