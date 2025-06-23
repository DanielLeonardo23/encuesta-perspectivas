'use server';

/**
 * @fileOverview Generates a summary report of survey responses using GenAI.
 *
 * - generateSummaryReport - A function that generates the summary report and actionable advice.
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
      sentiment: z.string(),
      detectedEmotions: z.array(z.string()),
      responseText: z.string(),
    })
  ).describe('Un array con los resultados del análisis de sentimiento para cada respuesta de la encuesta.'),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  report: z.string().describe('Un informe de resumen de las respuestas de la encuesta en español.'),
  numNegativeResponses: z.number().describe('El número de respuestas emocionales negativas.'),
  percentageConfused: z.number().describe('El porcentaje de estudiantes que se sienten confundidos.'),
  percentageStressed: z.number().describe('El porcentaje de estudiantes que se sienten estresados.'),
  percentageMotivated: z.number().describe('El porcentaje de estudiantes que se sienten motivados.'),
  suggestedImprovements: z.string().describe('Una lista de consejos prácticos y accionables para mejorar el curso, basados en los patrones recurrentes y comentarios significativos. Cada consejo debe empezar con un guion (-).'),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `Eres un consultor educativo experto. Tu tarea es analizar un conjunto de respuestas de una encuesta de satisfacción de un curso y generar un informe completo.

  Analiza las siguientes respuestas:
  {{#each sentimentAnalysisResults}}
  - Sentimiento: {{sentiment}} (Puntuación: {{score}})
    Emociones: {{#if detectedEmotions}}{{#each detectedEmotions}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Ninguna detectada{{/if}}
    Respuesta: "{{responseText}}"
  {{/each}}

  Basándote en el análisis de las respuestas, genera lo siguiente:
  - Un informe de resumen conciso en español para el campo "report".
  - Una lista de consejos prácticos y accionables para el instructor del curso para el campo "suggestedImprovements". Enfócate en los patrones recurrentes y en los comentarios más significativos. Cada consejo debe estar en español y empezar con un guion (-) en una nueva línea.
`,
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
