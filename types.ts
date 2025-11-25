export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectionResult {
  detected: boolean;
  number: number | null;
  boundingBox: BoundingBox | null;
  confidence: number;
  explanation?: string;
}

export interface AppState {
  isProcessing: boolean;
  currentResult: DetectionResult | null;
  history: { timestamp: number; result: DetectionResult }[];
}

export interface Settings {
  showBoundingBox: boolean;
  showConfidence: boolean;
  showHistory: boolean;
  autoProcess: boolean;
}