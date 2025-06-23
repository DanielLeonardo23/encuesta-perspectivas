"use server";

import { analyzeSentiment } from "@/ai/flows/analyze-sentiment";
import { generateSummaryReport } from "@/ai/flows/generate-summary-report";
import type { SurveyResponse, SummaryReport } from "@/lib/types";

export async function analyzeResponseAction(
  text: string
): Promise<SurveyResponse> {
  try {
    const analysis = await analyzeSentiment({ text });
    return {
      id: crypto.randomUUID(),
      text,
      ...analysis,
    };
  } catch (error) {
    console.error("Error in analyzeResponseAction:", error);
    throw new Error("Failed to analyze sentiment.");
  }
}

export async function generateReportAction(
  responses: SurveyResponse[]
): Promise<SummaryReport> {
  try {
    const sentimentAnalysisResults = responses.map((r) => ({
      score: r.score,
      magnitude: r.magnitude,
      sentiment: r.sentiment,
      detectedEmotions: r.detectedEmotions,
      responseText: r.text,
    }));

    const report = await generateSummaryReport({ sentimentAnalysisResults });
    return report;
  } catch (error) {
    console.error("Error in generateReportAction:", error);
    throw new Error("Failed to generate summary report.");
  }
}
