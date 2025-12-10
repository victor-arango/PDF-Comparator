export class PopplerChecker {
  constructor() {
    this.available = null;
  }

  async check() {
    if (this.available !== null) return this.available;

    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      try {
        await execAsync("pdftoppm -v");
        console.log("✅ Poppler está instalado (pdftoppm)");
        this.available = true;
      } catch {
        await execAsync("pdfinfo -v");
        console.log("✅ Poppler está instalado (pdfinfo)");
        this.available = true;
      }
    } catch {
      console.log("❌ Poppler NO está instalado");
      this.available = false;
    }

    return this.available;
  }
}
