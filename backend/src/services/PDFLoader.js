import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";


export class PDFLoader {
  async load(pdfPath) {
    const bytes = await fs.readFile(pdfPath);
    return await PDFDocument.load(bytes);
  }

  async getPageCount(pdfPath) {
    const pdf = await this.load(pdfPath);
    return pdf.getPageCount();
  }

  async getMetadata(pdfPath) {
    const pdf = await this.load(pdfPath);
    return {
      pageCount: pdf.getPageCount(),
      title: pdf.getTitle(),
      author: pdf.getAuthor(),
      subject: pdf.getSubject()
    };
  }
}
