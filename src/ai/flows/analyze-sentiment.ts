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
  sentiment: z
    .string()
    .describe('El sentimiento del texto (positivo, negativo o neutro).'),
  score: z
    .number()
    .describe(
      'La puntuación de sentimiento, que va de -1 (muy negativo) a 1 (muy positivo).'
    ),
  magnitude: z
    .number()
    .describe(
      'La magnitud del sentimiento, que indica la fuerza de la emoción (de 0 a infinito).'
    ),
  detectedEmotions: z
    .array(z.string())
    .describe(
      'Las emociones específicas detectadas en el texto (en español).'
    ),
});
export type AnalyzeSentimentOutput = z.infer<
  typeof AnalyzeSentimentOutputSchema
>;

export async function analyzeSentiment(
  input: AnalyzeSentimentInput
): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentimentPrompt',
  input: {schema: AnalyzeSentimentInputSchema},
  output: {schema: AnalyzeSentimentOutputSchema},
  prompt: `Eres un experto en análisis de sentimientos y psicología. Analiza el siguiente texto de una encuesta de satisfacción de un curso. Sé muy preciso y detallado en tu análisis.

Texto:
{{{text}}}

Proporciona un análisis de sentimiento detallado. La puntuación (score) debe reflejar con precisión el tono, desde -1.0 (muy negativo) hasta 1.0 (muy positivo). La magnitud (magnitude) debe indicar la intensidad emocional del texto. Identifica y extrae las emociones clave expresadas en el texto.

Responde en formato JSON con las siguientes claves:
- sentiment: "positivo", "negativo" o "neutro".
- score: un número entre -1.0 y 1.0.
- magnitude: un número que indica la fuerza de la emoción.
- detectedEmotions: un array de las emociones principales detectadas, en español (ej: ["alegría", "confusión", "frustración"]).
`,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
