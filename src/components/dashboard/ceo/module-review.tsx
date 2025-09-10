'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, FileWarning, Wrench, CheckCircle } from 'lucide-react';
import { reviewModuleCompletion, ModuleReviewOutput } from '@/ai/flows/module-review-ai-tool';
import { useForm, SubmitHandler } from "react-hook-form";

type FormValues = {
  moduleName: string;
  moduleDescription: string;
  completionDetails: string;
};

export default function ModuleReview() {
  const [result, setResult] = useState<ModuleReviewOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setError(null);
    setResult(null);
    try {
      const aiResult = await reviewModuleCompletion(data);
      setResult(aiResult);
    } catch (e) {
      console.error(e);
      setError('Failed to get review from AI. Please try again later.');
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> AI Module Review
          </CardTitle>
          <CardDescription>
            Get an AI-powered assessment of a completed module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moduleName">Module Name</Label>
              <Input id="moduleName" placeholder="e.g., User Authentication" {...register("moduleName", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleDescription">Module Description</Label>
              <Input id="moduleDescription" placeholder="Handles user sign-up, login, and sessions" {...register("moduleDescription", { required: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="completionDetails">Completion Details</Label>
            <Textarea
              id="completionDetails"
              placeholder="Paste code snippets, metrics, logs, or other relevant details here..."
              className="min-h-[150px]"
              {...register("completionDetails", { required: true })}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {result && (
            <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold text-lg">AI Analysis Results</h4>
                <Alert>
                  <FileWarning className="h-4 w-4" />
                  <AlertTitle>Potential Bottlenecks</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {result.potentialBottlenecks.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Wrench className="h-4 w-4" />
                  <AlertTitle>Suggested Solutions</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {result.suggestedSolutions.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-primary/10">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Overall Assessment</AlertTitle>
                  <AlertDescription>{result.overallAssessment}</AlertDescription>
                </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Module
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
