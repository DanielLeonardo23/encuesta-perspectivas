// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Sentiment analysis flow for analyzing survey responses.
 *
 * - analyzeSentiment - Analyzes the sentiment of a given text.
 * - AnalyzeSentimentInput - The input type for the analyzeSentiment function.
 * - AnalyzeSentimentOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSentimentInputSchema = z.object({
  text: z.string().describe('El texto a analizar.'),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z.string().describe('El sentimiento del texto (positivo, negativo o neutro).'),
  score: z.number().describe('La puntuación de sentimiento, que va de -1 a 1.'),
  magnitude: z.number().describe('La magnitud del sentimiento, que indica la fuerza de la emoción.'),
  detectedEmotions: z.array(z.string()).describe('Las emociones detectadas en el texto (en inglés).'),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;

export async function analyzeSentiment(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentimentPrompt',
  input: {schema: AnalyzeSentimentInputSchema},
  output: {schema: AnalyzeSentimentOutputSchema},
  prompt: `Analiza el sentimiento del siguiente texto y proporciona una puntuación de sentimiento, magnitud y emociones detectadas.

Texto: {{{text}}}

Responde en formato JSON con las siguientes claves:
- sentiment (positivo, negativo o neutro)
- score (un número entre -1 y 1)
- magnitude (un número que indica la fuerza de la emoción)
- detectedEmotions (un array de emociones detectadas en el texto, en inglés)
`,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
