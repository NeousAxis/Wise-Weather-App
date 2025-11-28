import { defineFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { gemini15Pro } from '@genkit-ai/googleai';
import * as z from 'zod';

export const quoteFlow = defineFlow(
    {
        name: 'quoteFlow',
        inputSchema: z.object({
            theme: z.string(),
            language: z.string(),
        }),
        outputSchema: z.string(),
    },
    async ({ theme, language }) => {
        const prompt = `Generate an inspiring quote or proverb about "${theme}" in ${language}. 
    The quote should be short, impactful, and related to nature or wisdom if possible. 
    Return ONLY the quote text, no attribution or extra text.`;

        const response = await generate({
            model: gemini15Pro,
            prompt: prompt,
            config: {
                temperature: 0.7,
            },
        });

        return response.text;
    }
);
