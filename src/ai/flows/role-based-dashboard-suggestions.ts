'use server';
/**
 * @fileOverview This file defines a Genkit flow for providing dashboard suggestions based on user roles.
 *
 * - `getDashboardSuggestions` - A function that suggests dashboards based on the user's job role.
 * - `DashboardSuggestionsInput` - The input type for the `getDashboardSuggestions` function.
 * - `DashboardSuggestionsOutput` - The return type for the `getDashboardSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DashboardSuggestionsInputSchema = z.object({
  jobRole: z
    .string()
    .describe(
      'The job role of the user, such as Team Lead, CEO, Developer, or Finance.'
    ),
});
export type DashboardSuggestionsInput = z.infer<typeof DashboardSuggestionsInputSchema>;

const DashboardSuggestionsOutputSchema = z.object({
  suggestedDashboards: z
    .array(z.string())
    .describe(
      'A list of dashboard names that are most relevant to the user based on their job role.'
    ),
  reasoning: z
    .string()
    .describe(
      'The AI reasoning behind the suggested dashboards, explaining why they are helpful for the given job role.'
    ),
});
export type DashboardSuggestionsOutput = z.infer<typeof DashboardSuggestionsOutputSchema>;

export async function getDashboardSuggestions(
  input: DashboardSuggestionsInput
): Promise<DashboardSuggestionsOutput> {
  return dashboardSuggestionsFlow(input);
}

const dashboardSuggestionsPrompt = ai.definePrompt({
  name: 'dashboardSuggestionsPrompt',
  input: {schema: DashboardSuggestionsInputSchema},
  output: {schema: DashboardSuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to suggest the most helpful dashboards to users based on their job role within TPMA (Tekjuice Project Management and Assignment).

  Given the user's job role, identify the dashboards that would provide the most relevant information and tools to assist them in their daily tasks. Explain your reasoning for each suggested dashboard.

  Job Role: {{{jobRole}}}

  Consider the following dashboards:
  - Project Overview: Provides a high-level view of all active projects, their status, and key milestones.
  - Task Management: Allows users to create, assign, and track tasks, and view task dependencies.
  - Financial Performance: Displays financial metrics related to projects, such as budget vs. actual spend, revenue, and profitability.
  - Team Performance: Shows individual and team performance metrics, such as task completion rates and time spent on tasks.
  - CEO Dashboard: A comprehensive dashboard for CEOs, offering insights into project performance, financial health, and team productivity.
  - Developer Dashboard: A dashboard tailored for developers, providing access to task assignments, code repositories, and build status.

  Output the suggested dashboards as a list of dashboard names, and provide a brief explanation of why each dashboard is helpful for the given role.
  `,
});

const dashboardSuggestionsFlow = ai.defineFlow(
  {
    name: 'dashboardSuggestionsFlow',
    inputSchema: DashboardSuggestionsInputSchema,
    outputSchema: DashboardSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await dashboardSuggestionsPrompt(input);
    return output!;
  }
);
