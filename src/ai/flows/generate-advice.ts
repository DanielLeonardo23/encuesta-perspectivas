'use server';
/**
 * @fileOverview Generates actionable advice based on survey responses.
 *
 * - generateAdvice - A function that generates advice.
 * - GenerateAdviceInput - The input type for the generateAdvice function.
 * - GenerateAdviceOutput - The return type for the generateAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAdviceInputSchema = z.object({
  responses: z
    .array(
      z.object({
        text: z.string(),
        sentiment: z.string(),
        score: z.number(),
        detectedEmotions: z.array(z.string()),
      })
    )
    .describe(
      'Un array con los resultados del análisis de sentimiento para cada respuesta de la encuesta.'
    ),
});
export type GenerateAdviceInput = z.infer<typeof GenerateAdviceInputSchema>;

const GenerateAdviceOutputSchema = z.object({
  advice: z
    .string()
    .describe(
      'Consejos prácticos y accionables para mejorar el curso. Cada consejo en una nueva línea.'
    ),
});
export type GenerateAdviceOutput = z.infer<typeof GenerateAdviceOutputSchema>;

export async function generateAdvice(
  input: GenerateAdviceInput
): Promise<GenerateAdviceOutput> {
  return generateAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdvicePrompt',
  input: {schema: GenerateAdviceInputSchema},
  output: {schema: GenerateAdviceOutputSchema},
  prompt: `Eres un consultor educativo experto. Tu tarea es analizar un conjunto de respuestas de una encuesta de satisfacción de un curso y proporcionar consejos claros, concisos y accionables para mejorar.

  Analiza las siguientes respuestas:
  {{#each responses}}
  - Sentimiento: {{sentiment}} (Puntuación: {{score}})
    Emociones: {{#if detectedEmotions}}{{#each detectedEmotions}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Ninguna detectada{{/if}}
    Respuesta: "{{text}}"
  {{/each}}

  Basándote en este análisis, genera una lista de consejos prácticos para el instructor del curso. Enfócate en los patrones recurrentes y en los comentarios más significativos. Los consejos deben estar en español, y cada punto debe empezar con un guion (-) en una nueva línea.`,
});

const generateAdviceFlow = ai.defineFlow(
  {
    name: 'generateAdviceFlow',
    inputSchema: GenerateAdviceInputSchema,
    outputSchema: GenerateAdviceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
