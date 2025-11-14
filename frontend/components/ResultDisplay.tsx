"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Use environment variable for API URL or fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GeneratedContent {
  content: string;
  pdf_url: string;
  title: string;
  quizId?: string;
}

interface GeneratedContentWithType extends GeneratedContent {
  type: 'quiz' | 'assignment' | 'summary';
}

const ResultDisplay = ({ generatedContent }: { generatedContent: GeneratedContentWithType | null }) => {
  const { toast } = useToast();
  const router = useRouter();

  const handleDownload = useCallback(() => {
    if (!generatedContent?.pdf_url) {
      toast({
        title: "Download Error",
        description: "PDF is not available. Please try generating the content again.",
        variant: "destructive",
      });
      return;
    }

    const fullUrl = `${API_URL}${generatedContent.pdf_url}`;
    window.open(fullUrl, '_blank');
  }, [generatedContent, toast]);

  if (!generatedContent) {
    return (
      <div className="p-4 text-center">
        <div className="p-4 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
            No Content Available
          </h3>
          <p className="text-amber-600 dark:text-amber-400 mt-2">
            No generated content to display. Please generate content first.
          </p>
        </div>
      </div>
    );
  }

  // === 🔍 SPLIT MULTIPLE SOLUTIONS ===
  const solutionRegex = /### Solution \d+\s*/gi;
  const rawSolutions = generatedContent.content?.split(solutionRegex).filter(Boolean) || [];

  // Extract solution titles separately
  const titleMatches = [...generatedContent.content.matchAll(/### Solution (\d+)/gi)];
  const solutionTitles = titleMatches.map(match => `Solution ${match[1]}`);

  const hasMultipleSolutions = rawSolutions.length > 1;

  return (
    <div className="mt-8 animate-fadeIn space-y-6">
      <Card className="max-w-3xl mx-auto shadow-lg border-primary/20 bg-gradient-to-b from-background to-muted/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">{generatedContent.title}</CardTitle>
          <CardDescription>
            {hasMultipleSolutions ? "Multiple Solutions Generated" : "Generated Content"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center gap-4">
          <Button 
            onClick={handleDownload}
            className="bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </CardContent>
      </Card>

      {rawSolutions.map((sol, index) => (
        <Card key={index} className="max-w-3xl mx-auto border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary">{solutionTitles[index] || `Solution ${index + 1}`}</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/10 rounded-md p-4 max-h-[60vh] overflow-y-auto">
            {sol.trim()}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ResultDisplay;
