import type { AnalyzeSentimentOutput } from "@/ai/flows/analyze-sentiment";
import type { GenerateSummaryReportOutput } from "@/ai/flows/generate-summary-report";

export interface SurveyResponse extends AnalyzeSentimentOutput {
  id: string;
  text: string;
}

export type SummaryReport = GenerateSummaryReportOutput;
