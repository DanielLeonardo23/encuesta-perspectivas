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
  Sparkles,
  TrendingDown,
  Upload,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const formSchema = z.object({
  answer: z.string().min(10, "La respuesta debe tener al menos 10 caracteres."),
});

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

  if (!report) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Informe General</CardTitle>
          <CardDescription>
            Genera un informe para ver un resumen y métricas clave.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mb-4" />
          <p className="font-semibold">No hay informe que mostrar</p>
          <p className="text-sm">
            Haz clic en el botón "Generar Informe" en la cabecera.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-accent" /> Resumen Generado por IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.report}</p>
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
            <Sparkles className="text-accent" />
            Consejos y Mejoras Accionables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground mb-4 italic whitespace-pre-wrap">"{response.text}"</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Sentimiento</span>
            <Badge variant="outline" className="w-fit" data-sentiment={response.sentiment}>
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
                <Badge key={emotion} variant="secondary" className="capitalize">
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

const IndividualAnalysisView = ({ responses }: { responses: SurveyResponse[] }) => {
  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg mt-4">
        <FileText className="h-12 w-12 mb-4" />
        <p className="font-semibold">Aún no hay respuestas analizadas</p>
        <p className="text-sm">
          Completa una encuesta o importa un CSV para ver el análisis.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={responses[0].id} className="w-full mt-4">
      <TabsList className="relative">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-2 p-1">
            {responses.map((response, index) => (
              <TabsTrigger key={response.id} value={response.id}>
                Respuesta {responses.length - index}
              </TabsTrigger>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </TabsList>
      {responses.map((response) => (
        <TabsContent key={response.id} value={response.id} className="mt-4">
          <ResponseCard response={response} />
        </TabsContent>
      ))}
    </Tabs>
  );
};


export default function SurveyInsightsPage() {
  const questions = [
    "¿Qué te pareció el ritmo general del curso?",
    "¿Fueron claros y útiles los materiales proporcionados?",
    "¿Cómo calificarías la calidad de la enseñanza del instructor?",
    "¿Hay algo que te gustaría que se mejorara para futuros cursos?",
    "¿Recomendarías este curso a un amigo o colega? ¿Por qué?",
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => Array(questions.length).fill(""));
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { answer: "" },
  });

  useEffect(() => {
    form.setValue("answer", answers[currentStep] || "");
  }, [currentStep, answers, form]);

  const processForm = async (values: z.infer<typeof formSchema>) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = values.answer;
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsAnalyzing(true);
      const combinedText = newAnswers
        .map((ans, i) => `${questions[i]}\nRespuesta: ${ans}`)
        .join("\n\n");

      try {
        const { analyzeResponseAction } = (await import("./actions")) as {
          analyzeResponseAction: typeof analyzeResponseAction;
        };
        const result = await analyzeResponseAction(combinedText);
        setResponses((prev) => [result, ...prev]);
        setAnswers(Array(questions.length).fill(""));
        setCurrentStep(0);
        form.reset({ answer: "" });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Análisis Fallido",
          description: "No se pudo analizar el sentimiento. Por favor, inténtalo de nuevo.",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };
  
  const handlePreviousStep = () => {
    const currentAnswer = form.getValues("answer");
    const newAnswers = [...answers];
    newAnswers[currentStep] = currentAnswer;
    setAnswers(newAnswers);

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
    setActiveTab("report");
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
        description: "No se pudo importar o analizar el archivo CSV. Asegúrate de que tenga el formato correcto.",
      });
    } finally {
      setIsImporting(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Encuesta de Satisfacción</CardTitle>
              <CardDescription>
                Pregunta {currentStep + 1} de {questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(processForm)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-base">{questions[currentStep]}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            {...field}
                            rows={5}
                            className="resize-y"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between items-center gap-4">
                    <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0 || isAnalyzing}>
                      Anterior
                    </Button>
                    <Button type="submit" disabled={isAnalyzing}>
                      {isAnalyzing && currentStep === questions.length - 1 ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {currentStep === questions.length - 1 ? 'Analizar Respuestas' : 'Siguiente'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {isClient && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Análisis Individual</TabsTrigger>
                <TabsTrigger value="report" disabled={responses.length === 0}>Informe General</TabsTrigger>
              </TabsList>
              <TabsContent value="individual">
                <IndividualAnalysisView responses={responses} />
              </TabsContent>
              <TabsContent value="report">
                <ReportSummary report={report} isGenerating={isGeneratingReport} />
              </TabsContent>
            </Tabs>
          )}
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
