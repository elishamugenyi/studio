'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { getDashboardSuggestions, DashboardSuggestionsOutput } from '@/ai/flows/role-based-dashboard-suggestions';
import type { UserRole } from '@/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function DashboardSuggestions({ role }: { role: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DashboardSuggestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await getDashboardSuggestions({ jobRole: role });
      setSuggestions(result);
    } catch (e) {
      console.error(e);
      setError('Could not fetch AI suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="mr-2 h-4 w-4" />
          Dashboard Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Dashboard Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered recommendations for the most useful dashboards for a {role}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!suggestions && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Lightbulb className="h-10 w-10 text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">Click the button below to generate suggestions.</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Generating suggestions...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {suggestions && (
            <div className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Reasoning</AlertTitle>
                <AlertDescription>{suggestions.reasoning}</AlertDescription>
              </Alert>
              <div>
                <h4 className="font-semibold mb-2">Suggested Dashboards:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.suggestedDashboards.map((dash, index) => (
                    <li key={index}>{dash}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleFetchSuggestions} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
