"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  FileText,
  Frown,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  Meh,
  Smile,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { generateReportAction, analyzeResponseAction } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv, parseCsvToTexts } from "@/lib/csv";
import type { SurveyResponse, SummaryReport } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  text: z.string().min(10, "Response must be at least 10 characters long."),
});

const SurveyForm = ({
  isAnalyzing,
  form,
  onSubmit,
}: {
  isAnalyzing: boolean;
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Submit a Response</CardTitle>
      <CardDescription>
        Enter a survey response below to analyze its sentiment.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Survey Response</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 'I found the course material very engaging and well-structured.'"
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isAnalyzing} className="w-full">
            {isAnalyzing && <Loader2 className="mr-2 animate-spin" />}
            Analyze Sentiment
          </Button>
        </form>
      </Form>
    </CardContent>
  </Card>
);

const ReportSummary = ({
  report,
  isGenerating,
}: {
  report: SummaryReport | null;
  isGenerating: boolean;
}) => {
  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Report...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent" /> AI-Generated Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{report.report}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Negative Responses</span>
            <span className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="text-destructive" />
              {report.numNegativeResponses}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium">Confused</label>
            <Progress value={report.percentageConfused} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Stressed</label>
            <Progress value={report.percentageStressed} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Motivated</label>
            <Progress value={report.percentageMotivated} className="mt-1" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-accent" />
            Suggested Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {report.suggestedImprovements}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const ResponseCard = ({ response }: { response: SurveyResponse }) => {
  const getSentimentIcon = () => {
    if (response.sentiment === "positive")
      return <Smile className="text-green-500" />;
    if (response.sentiment === "negative")
      return <Frown className="text-red-500" />;
    return <Meh className="text-gray-500" />;
  };

  const getSentimentColor = () => {
    if (response.sentiment === "positive") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (response.sentiment === "negative") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground mb-4 italic">"{response.text}"</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Sentiment</span>
            <Badge variant="outline" className={`w-fit ${getSentimentColor()}`}>
              {getSentimentIcon()}
              <span className="ml-2 capitalize">{response.sentiment}</span>
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Score</span>
            <span>{response.score.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Magnitude</span>
            <span>{response.magnitude.toFixed(2)}</span>
          </div>
        </div>
        {response.detectedEmotions.length > 0 && (
          <div className="mt-4">
            <span className="font-semibold text-sm">Detected Emotions</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {response.detectedEmotions.map((emotion) => (
                <Badge key={emotion} variant="secondary">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ResponseList = ({ responses }: { responses: SurveyResponse[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Analyzed Responses</CardTitle>
      <CardDescription>
        Here are the sentiment analysis results for each response.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mb-4" />
          <p className="font-semibold">No responses yet</p>
          <p className="text-sm">
            Submit a response or import a CSV to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <ResponseCard key={response.id} response={response} />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function SurveyInsightsPage() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const handleAnalyzeSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsAnalyzing(true);
    try {
      // Lazy-load server action
      const { analyzeResponseAction } = (await import("./actions")) as { analyzeResponseAction: typeof analyzeResponseAction };
      const result = await analyzeResponseAction(values.text);
      setResponses((prev) => [result, ...prev]);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the sentiment. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (responses.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot Generate Report",
        description: "Please analyze at least one response first.",
      });
      return;
    }
    setIsGeneratingReport(true);
    setReport(null);
    try {
      const { generateReportAction } = (await import("./actions")) as { generateReportAction: typeof generateReportAction };
      const reportData = await generateReportAction(responses);
      setReport(reportData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: "Could not generate the summary report.",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExport = () => {
    if (responses.length === 0) {
      toast({
        variant: "destructive",
        title: "Nothing to Export",
        description: "Analyze some responses before exporting.",
      });
      return;
    }
    exportToCsv(responses);
    toast({
      title: "Export Successful",
      description: "Your data has been exported to CSV.",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const texts = await parseCsvToTexts(file);
      if (texts.length === 0) {
        throw new Error("CSV file is empty or invalid.");
      }
      
      const { analyzeResponseAction } = (await import("./actions")) as { analyzeResponseAction: typeof analyzeResponseAction };
      
      const newResponses: SurveyResponse[] = [];
      for (const text of texts) {
        if (text.trim()) {
           const result = await analyzeResponseAction(text);
           newResponses.push(result);
        }
      }
      setResponses(prev => [...newResponses.reverse(), ...prev]);

      toast({
        title: "Import Successful",
        description: `Successfully imported and analyzed ${newResponses.length} responses.`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description:
          "Could not import or parse the CSV file. Please ensure it's a single-column CSV.",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-10 w-full border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">
              Survey Insights
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || isAnalyzing}
            >
              {isImporting ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Upload className="mr-2" />
              )}
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={responses.length === 0}>
              <Download className="mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={responses.length === 0 || isGeneratingReport}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isGeneratingReport ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <FileText className="mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <SurveyForm
              form={form}
              isAnalyzing={isAnalyzing}
              onSubmit={handleAnalyzeSubmit}
            />
            <ReportSummary report={report} isGenerating={isGeneratingReport} />
          </div>

          <div className="lg:col-span-2">
            <ResponseList responses={responses} />
          </div>
        </div>
      </main>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        accept=".csv"
      />
    </div>
  );
}
