import { EventEmitter } from "../utils/EventEmitter.js";

export class BatchProcessor extends EventEmitter {
  constructor(batchSize = 50, maxConcurrent = 5) {
    super();
    this.batchSize = batchSize;
    this.maxConcurrent = maxConcurrent;
  }

  async process(items, processFn) {
    const results = [];
    const total = items.length;
    
    for (let i = 0; i < total; i += this.batchSize) {
      const batch = items.slice(i, Math.min(i + this.batchSize, total));
      const batchNum = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(total / this.batchSize);
      
      this.emit("batchStart", { batchNum, totalBatches, size: batch.length });
      
      const batchResults = await this.processBatch(batch, processFn, i);
      results.push(...batchResults);
      
      this.emit("batchComplete", { 
        batchNum, 
        totalBatches, 
        processed: results.length,
        total 
      });
      
      // Liberar memoria entre lotes
      if (global.gc) global.gc();
    }
    
    return results;
  }

  async processBatch(batch, processFn, offset) {
    const chunks = this.chunkArray(batch, this.maxConcurrent);
    const results = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((item, idx) => 
          processFn(item, offset + results.length + idx)
        )
      );
      results.push(...chunkResults);
    }
    
    return results;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}