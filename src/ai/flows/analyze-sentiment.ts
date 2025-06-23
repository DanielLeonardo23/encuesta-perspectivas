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
  text: z.string().describe('The text to analyze for sentiment.'),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z.string().describe('The sentiment of the text (positive, negative, or neutral).'),
  score: z.number().describe('The sentiment score, ranging from -1 to 1.'),
  magnitude: z.number().describe('The magnitude of the sentiment, indicating the strength of the emotion.'),
  detectedEmotions: z.array(z.string()).describe('The emotions detected in the text.'),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;

export async function analyzeSentiment(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSentimentPrompt',
  input: {schema: AnalyzeSentimentInputSchema},
  output: {schema: AnalyzeSentimentOutputSchema},
  prompt: `Analyze the sentiment of the following text and provide a sentiment score, magnitude, and detected emotions.

Text: {{{text}}}

Respond in JSON format with the following keys:
- sentiment (positive, negative, or neutral)
- score (a number between -1 and 1)
- magnitude (a number indicating the strength of the emotion)
- detectedEmotions (an array of emotions detected in the text)
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
