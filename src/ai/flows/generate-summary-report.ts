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
  ).describe('Un array con los resultados del análisis de sentimiento para cada respuesta de la encuesta.'),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  report: z.string().describe('Un informe de resumen de las respuestas de la encuesta.'),
  numNegativeResponses: z.number().describe('El número de respuestas emocionales negativas.'),
  percentageConfused: z.number().describe('El porcentaje de estudiantes que se sienten confundidos.'),
  percentageStressed: z.number().describe('El porcentaje de estudiantes que se sienten estresados.'),
  percentageMotivated: z.number().describe('El porcentaje de estudiantes que se sienten motivados.'),
  suggestedImprovements: z.string().describe('Sugerencias de mejoras basadas en el sentimiento general.'),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `Eres un asistente de IA que genera informes de resumen para respuestas de encuestas.

  Analiza los siguientes resultados de análisis de sentimiento y proporciona un informe de resumen completo que incluya:
  - El número de respuestas emocionales negativas.
  - El porcentaje de estudiantes que se sienten confundidos, estresados y motivados.
  - Sugerencias de mejoras basadas en el sentimiento general.

  Resultados del Análisis de Sentimiento: {{{sentimentAnalysisResults}}}

  Asegúrate de completar todos los campos de salida especificados en el esquema de salida.
  - El campo "report" debe ser un párrafo conciso en español.
  - El campo "suggestedImprovements" debe ser una lista de puntos en español, donde cada punto empieza con un guion (-).`,
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
    const percentageConfused = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('confusión') || result.detectedEmotions.includes('confusion')).length / totalResponses) * 100;
    const percentageStressed = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('estrés') || result.detectedEmotions.includes('stress')).length / totalResponses) * 100;
    const percentageMotivated = (sentimentAnalysisResults.filter(result => result.detectedEmotions.includes('motivación') || result.detectedEmotions.includes('motivation')).length / totalResponses) * 100;

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
