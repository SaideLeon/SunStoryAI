'use server';
/**
 * @fileOverview A GenAI agent for generating personalized greetings based on the time of day.
 *
 * - generatePersonalizedGreeting - A function that handles the greeting generation process.
 * - PersonalizedGreetingInput - The input type for the generatePersonalizedGreeting function.
 * - PersonalizedGreetingOutput - The return type for the generatePersonalizedGreeting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedGreetingInputSchema = z.object({
  currentTime: z
    .string()
    .describe('The current time formatted as a string (e.g., "10:30 AM").'),
  timeOfDayContext: z
    .string()
    .describe('A context string indicating the general time of day (e.g., "morning", "afternoon", "evening", "night").'),
  userName: z.string().optional().describe('The name of the user for a personalized greeting.'),
});
export type PersonalizedGreetingInput = z.infer<typeof PersonalizedGreetingInputSchema>;

const PersonalizedGreetingOutputSchema = z.object({
  greeting: z.string().describe('A personalized greeting reflecting the time of day.'),
});
export type PersonalizedGreetingOutput = z.infer<typeof PersonalizedGreetingOutputSchema>;

export async function generatePersonalizedGreeting(
  input: { userName?: string }
): Promise<PersonalizedGreetingOutput> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const timeOfDayContext = (() => {
    if (hours >= 5 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 17) return 'afternoon';
    if (hours >= 17 && hours < 21) return 'evening';
    return 'night';
  })();

  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return personalizedGreetingFlow({
    currentTime: formattedTime,
    timeOfDayContext,
    userName: input.userName,
  });
}

const personalizedGreetingPrompt = ai.definePrompt({
  name: 'personalizedGreetingPrompt',
  input: { schema: PersonalizedGreetingInputSchema },
  output: { schema: PersonalizedGreetingOutputSchema },
  prompt: `You are a friendly assistant. Based on the current time and context, create a personalized greeting.

Current time: {{{currentTime}}}
Time of day context: {{{timeOfDayContext}}}
{{#if userName}}User Name: {{{userName}}}{{/if}}

Your greeting should be warm and welcoming. If a user name is provided, use it. Do not include introductory phrases like 'Here is your greeting:', just the greeting itself.`,
});

const personalizedGreetingFlow = ai.defineFlow(
  {
    name: 'personalizedGreetingFlow',
    inputSchema: PersonalizedGreetingInputSchema,
    outputSchema: PersonalizedGreetingOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedGreetingPrompt(input);
    return output!;
  }
);
