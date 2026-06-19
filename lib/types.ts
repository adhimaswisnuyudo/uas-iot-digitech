export interface AiSectionResult {
  passed: boolean;
  note: string;
}

export interface AiAnalysisResult {
  faceDetected: boolean;
  durationSeconds?: number;
  durationValid?: boolean;
  sections: {
    perkenalan: AiSectionResult;
    refleksi_dan_feedback: AiSectionResult;
    gagasan_inovasi: AiSectionResult;
    penutup: AiSectionResult;
  };
  possibleTtsOrAvatar: boolean;
  overallScore: number;
  summary: string;
}

export interface SubmissionPublic {
  id: string;
  kelas: string;
  nama: string;
  npm: string;
  youtubeUrl: string;
  youtubeId: string;
  duration: number | null;
  durationValid: boolean;
  aiStatus: string;
  aiScore: number | null;
  aiResult: AiAnalysisResult | null;
  aiError: string | null;
  createdAt: string;
}
