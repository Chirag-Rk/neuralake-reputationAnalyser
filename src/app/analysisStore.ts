import type { Analysis } from './results';

let analysisData: Analysis | null = null;

export function setAnalysis(data: Analysis) {
  analysisData = data;
}

export function getAnalysis() {
  return analysisData;
}

export function clearAnalysis() {
  analysisData = null;
}
