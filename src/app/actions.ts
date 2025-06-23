"use server";

import { analyzeSentiment } from "@/ai/flows/analyze-sentiment";
import { generateAdvice } from "@/ai/flows/generate-advice";
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

export async function generateAdviceAction(
  responses: SurveyResponse[]
): Promise<{ advice: string }> {
  try {
    const adviceData = await generateAdvice({ responses });
    return adviceData;
  } catch (error) {
    console.error("Error in generateAdviceAction:", error);
    throw new Error("Failed to generate advice.");
  }
}
