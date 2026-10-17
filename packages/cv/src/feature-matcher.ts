export class VisualFeatureMatcher {
  /**
   * Cosine similarity between two feature vectors [0.0 - 1.0]
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0.0;

    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA <= 1e-9 || normB <= 1e-9) return 0.0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Euclidean distance between two feature vectors
   */
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity;

    let sum = 0.0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}
