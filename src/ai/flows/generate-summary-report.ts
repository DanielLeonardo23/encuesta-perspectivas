'use server';

/**
 * @fileOverview Generates a summary report of survey responses using GenAI.
 *
 * - generateSummaryReport - A function that generates the summary report.
 * - GenerateSummaryReportInput - The input type for the generateSummaryReport function.
 * - GenerateSummaryReportOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSummaryReportInputSchema = z.object({
  sentimentAnalysisResults: z.array(
    z.object({
      score: z.number(),
      magnitude: z.number(),
      detectedEmotions: z.array(z.string()),
      responseText: z.string(),
    })
  ).describe('An array of sentiment analysis results for each survey response.'),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  report: z.string().describe('A summary report of the survey responses.'),
  numNegativeResponses: z.number().describe('The number of negative emotional responses.'),
  percentageConfused: z.number().describe('The percentage of students feeling confused.'),
  percentageStressed: z.number().describe('The percentage of students feeling stressed.'),
  percentageMotivated: z.number().describe('The percentage of students feeling motivated.'),
  suggestedImprovements: z.string().describe('Suggestions for improvements based on overall sentiment.'),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `You are an AI assistant that generates summary reports for survey responses.

  Analyze the following sentiment analysis results and provide a comprehensive summary report including:
  - The number of negative emotional responses.
  - The percentage of students feeling confused, stressed, and motivated.
  - Suggestions for improvements based on the overall sentiment.

  Sentiment Analysis Results: {{{sentimentAnalysisResults}}}

  Make sure to populate all the output fields specified in the output schema.`,
});

const generateSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateSummaryReportFlow',
    inputSchema: GenerateSummaryReportInputSchema,
    outputSchema: GenerateSummaryReportOutputSchema,
  },
  async input => {
    const {
      sentimentAnalysisResults,
    } = input;

    // Calculate the number of negative responses.
    const numNegativeResponses = sentimentAnalysisResults.filter(result => result.score < 0).length;

    // Calculate the percentages for confused, stressed, and motivated.
    const totalResponses = sentimentAnalysisResults.length;
    const percentageConfused = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('confusion')).length / totalResponses) * 100;
    const percentageStressed = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('stress')).length / totalResponses) * 100;
    const percentageMotivated = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('motivation')).length / totalResponses) * 100;

    const {output} = await prompt({
      ...input,
    });

    return {
      ...output!,
      numNegativeResponses,
      percentageConfused,
      percentageStressed,
      percentageMotivated,
    };
  }
);
