export interface UsageSummary {
  requests: number;
  success: number;
  failed: number;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ApiUsageStats {
  gemini: {
    configured: boolean;
    model: string;
    today: UsageSummary;
    total: UsageSummary;
    lastCall: string | null;
    lastModel: string | null;
  };
  youtube: {
    configured: boolean;
    today: UsageSummary;
    total: UsageSummary;
    lastCall: string | null;
  };
  submissions: {
    total: number;
    byStatus: Record<string, number>;
  };
  dashboardUrl: string;
  rateLimitUrl: string;
  note: string;
}
