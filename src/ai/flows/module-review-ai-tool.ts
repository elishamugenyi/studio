'use server';

/**
 * @fileOverview An AI tool to assist CEOs in reviewing module completions.
 *
 * - reviewModuleCompletion - A function that handles the module completion review process.
 * - ModuleReviewInput - The input type for the reviewModuleCompletion function.
 * - ModuleReviewOutput - The return type for the reviewModuleCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModuleReviewInputSchema = z.object({
  moduleName: z.string().describe('The name of the module to review.'),
  moduleDescription: z.string().describe('A detailed description of the module.'),
  completionDetails: z.string().describe('Details about the module completion, including code snippets, metrics, and logs.'),
});
export type ModuleReviewInput = z.infer<typeof ModuleReviewInputSchema>;

const ModuleReviewOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the module completion.'),
  potentialBottlenecks: z.array(z.string()).describe('An array of potential bottlenecks identified in the module.'),
  codeIssues: z.array(z.string()).describe('An array of potential code issues identified in the module.'),
  suggestedSolutions: z.array(z.string()).describe('An array of suggested solutions to address the identified bottlenecks and issues.'),
  overallAssessment: z.string().describe('An overall assessment of the module completion, including recommendations.'),
});
export type ModuleReviewOutput = z.infer<typeof ModuleReviewOutputSchema>;

export async function reviewModuleCompletion(input: ModuleReviewInput): Promise<ModuleReviewOutput> {
  return moduleReviewFlow(input);
}

const moduleReviewPrompt = ai.definePrompt({
  name: 'moduleReviewPrompt',
  input: {schema: ModuleReviewInputSchema},
  output: {schema: ModuleReviewOutputSchema},
  prompt: `You are an AI assistant helping a CEO review module completions in a software project.

  Analyze the following information about the module:
  Module Name: {{{moduleName}}}
  Module Description: {{{moduleDescription}}}
  Completion Details: {{{completionDetails}}}

  Identify any potential bottlenecks or code issues, and suggest possible solutions.
  Provide a concise summary and an overall assessment of the module completion.

  Format your response as a JSON object with the following keys:
  - summary: A concise summary of the module completion.
  - potentialBottlenecks: An array of potential bottlenecks identified in the module.
  - codeIssues: An array of potential code issues identified in the module.
  - suggestedSolutions: An array of suggested solutions to address the identified bottlenecks and issues.
  - overallAssessment: An overall assessment of the module completion, including recommendations.`,
});

const moduleReviewFlow = ai.defineFlow(
  {
    name: 'moduleReviewFlow',
    inputSchema: ModuleReviewInputSchema,
    outputSchema: ModuleReviewOutputSchema,
  },
  async input => {
    const {output} = await moduleReviewPrompt(input);
    return output!;
  }
);
