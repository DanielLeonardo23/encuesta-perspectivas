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
  text: z.string().min(10, "La respuesta debe tener al menos 10 caracteres."),
});

const PredefinedQuestions = ({ onQuestionSelect }: { onQuestionSelect: (question: string) => void }) => {
  const questions = [
    "¿Qué te pareció el ritmo general del curso?",
    "¿Fueron claros y útiles los materiales proporcionados?",
    "¿Cómo calificarías la calidad de la enseñanza del instructor?",
    "¿Hay algo que te gustaría que se mejorara para futuros cursos?",
    "¿Recomendarías este curso a un amigo o colega? ¿Por qué?",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preguntas de la Encuesta</CardTitle>
        <CardDescription>
          Haz clic en una pregunta para empezar a escribir tu respuesta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <Button
            key={i}
            variant="outline"
            className="text-left justify-start h-auto whitespace-normal"
            onClick={() => onQuestionSelect(q)}
          >
            {q}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

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
      <CardTitle>Enviar una Respuesta</CardTitle>
      <CardDescription>
        Introduce una respuesta de la encuesta a continuación para analizar su sentimiento.
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
                <FormLabel>Respuesta de la Encuesta</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: 'El material del curso me pareció muy interesante y bien estructurado.'"
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
            Analizar Sentimiento
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
          <CardTitle>Generando Informe...</CardTitle>
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
            <Lightbulb className="text-accent" /> Resumen Generado por IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{report.report}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métricas Clave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Respuestas Negativas</span>
            <span className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="text-destructive" />
              {report.numNegativeResponses}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium">Confundido</label>
            <Progress value={report.percentageConfused} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Estresado</label>
            <Progress value={report.percentageStressed} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Motivado</label>
            <Progress value={report.percentageMotivated} className="mt-1" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-accent" />
            Sugerencias de Mejora
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
            <span className="font-semibold">Sentimiento</span>
            <Badge variant="outline" className={`w-fit ${getSentimentColor()}`}>
              {getSentimentIcon()}
              <span className="ml-2 capitalize">{response.sentiment}</span>
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Puntuación</span>
            <span>{response.score.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Magnitud</span>
            <span>{response.magnitude.toFixed(2)}</span>
          </div>
        </div>
        {response.detectedEmotions.length > 0 && (
          <div className="mt-4">
            <span className="font-semibold text-sm">Emociones Detectadas</span>
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
      <CardTitle>Respuestas Analizadas</CardTitle>
      <CardDescription>
        Aquí están los resultados del análisis de sentimiento para cada respuesta.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mb-4" />
          <p className="font-semibold">Aún no hay respuestas</p>
          <p className="text-sm">
            Envía una respuesta o importa un CSV para comenzar.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const handleQuestionSelect = (question: string) => {
    const currentText = form.getValues("text");
    const newText = currentText ? `${currentText}\n\n${question} \n` : `${question} \n\n`;
    form.setValue("text", newText, { shouldValidate: true });
    textareaRef.current?.focus();
  };


  const handleAnalyzeSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsAnalyzing(true);
    try {
      const { analyzeResponseAction } = (await import("./actions")) as { analyzeResponseAction: typeof analyzeResponseAction };
      const result = await analyzeResponseAction(values.text);
      setResponses((prev) => [result, ...prev]);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Análisis Fallido",
        description: "No se pudo analizar el sentimiento. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (responses.length === 0) {
      toast({
        variant: "destructive",
        title: "No se puede generar el informe",
        description: "Por favor, analiza al menos una respuesta primero.",
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
        title: "Falló la Generación del Informe",
        description: "No se pudo generar el informe de resumen.",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExport = () => {
    if (responses.length === 0) {
      toast({
        variant: "destructive",
        title: "Nada que Exportar",
        description: "Analiza algunas respuestas antes de exportar.",
      });
      return;
    }
    exportToCsv(responses);
    toast({
      title: "Exportación Exitosa",
      description: "Tus datos han sido exportados a CSV.",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const texts = await parseCsvToTexts(file);
      if (texts.length === 0) {
        throw new Error("El archivo CSV está vacío o no es válido.");
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
        title: "Importación Exitosa",
        description: `Se importaron y analizaron exitosamente ${newResponses.length} respuestas.`,
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Importación Fallida",
        description:
          "No se pudo importar o analizar el archivo CSV. Asegúrate de que sea un CSV de una sola columna.",
      });
    } finally {
      setIsImporting(false);
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
              Perspectivas de Encuesta
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
              Importar CSV
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={responses.length === 0}>
              <Download className="mr-2" />
              Exportar CSV
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
              Generar Informe
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-1 flex flex-col gap-8">
             <PredefinedQuestions onQuestionSelect={handleQuestionSelect} />
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
