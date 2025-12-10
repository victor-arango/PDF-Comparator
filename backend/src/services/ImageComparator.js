import pkg from "odiff-bin";
const { compare: compareImages } = pkg;

export class ImageComparator {
  constructor(config) {
    this.config = config;
  }

  async compare(originalImg, modifiedImg, diffPath) {
    const result = await compareImages(originalImg, modifiedImg, diffPath, {
      threshold: this.config.comparison.threshold,
      antialiasing: this.config.comparison.antialiasing,
      outputDiffMask: true
    });

    return {
      match: result.match === true,
      diffPercentage: this.calculateDiffPercentage(result),
      rawResult: result
    };
  }

  calculateDiffPercentage(result) {
    if (!result.diffPercentage) return 0;
    
    let percentage = typeof result.diffPercentage === "number" 
      ? result.diffPercentage 
      : parseFloat(result.diffPercentage) || 0;

    if (percentage > 1 && percentage <= 100) {
      return percentage;
    } else if (percentage > 100) {
      return percentage / 100;
    } else if (percentage > 0 && percentage <= 1) {
      return percentage * 100;
    }
    
    return 0;
  }
}