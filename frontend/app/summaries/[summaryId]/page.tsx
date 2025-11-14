"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { useState, useEffect } from "react"; // Added hooks

// Interface for summary data (adjust based on API)
interface SummaryData {
  id: string;
  title: string; // Should be generated or extracted
  summaryText: string;
  originalFilePath: string;
  originalFilename: string;
  createdAt: string; // Assuming ISO string from API
}

export default function SummaryViewPage() {
  const params = useParams();
  const summaryId = params.summaryId as string;
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!summaryId) {
        setIsLoading(false);
        setError("Invalid Summary ID.");
        return;
    }

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- TODO: Replace with actual API call --- 
        // const response = await fetch(`/api/summaries/${summaryId}`);
        // if (!response.ok) { throw new Error(`Failed to fetch summary (status: ${response.status})`); }
        // const data: SummaryData = await response.json();
        
        // Mock data for now:
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data: SummaryData = {
          id: summaryId,
          title: `Summary of Mock Document ${summaryId}`,
          summaryText: "This is a mock summary fetched for the document. It highlights the key points extracted via AI analysis.",
          createdAt: new Date().toISOString(),
          originalFilePath: `/uploads/mock_${summaryId}.pdf`, // Example path
          originalFilename: `mock_${summaryId}.pdf`,
        };
        // --- End Replace --- 
        
        setSummary(data);
      } catch (err: any) {
        console.error("Error fetching summary:", err);
        setError(err.message || "Failed to load summary data.");
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [summaryId]);

  // --- TODO: Implement Button Actions --- 
  const handleDownload = () => {
    console.log("Download Summary clicked (TODO: Implement)");
    // Add logic to download summary (e.g., create text file from summary.summaryText)
  };
  const handleViewOriginal = () => {
     console.log("View Original clicked (TODO: Implement)");
     // Add logic to view original document (e.g., open summary.originalFilePath in new tab)
  };
  // --- End Button Actions --- 

  // Loading State
  if (isLoading) {
    return (
      <div className="container py-8 mt-16">
         <Link href="/dashboard" className="inline-flex items-center text-sm mb-4 hover:underline">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Dashboard
         </Link>
         <div className="flex justify-center items-center pt-10">
           <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
         </div>
       </div>
    );
  }
  
  // Error State
  if (error) {
     return (
       <div className="container py-8 mt-16">
         <Link href="/dashboard" className="inline-flex items-center text-sm mb-4 hover:underline">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Dashboard
         </Link>
         <Card className="max-w-4xl mx-auto border-destructive">
           <CardHeader>
             <CardTitle className="text-destructive">Error Loading Summary</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-destructive">{error}</p>
           </CardContent>
         </Card>
       </div>
    );
  }

  // Not Found State
  if (!summary) {
     return (
       <div className="container py-8 mt-16">
         <Link href="/dashboard" className="inline-flex items-center text-sm mb-4 hover:underline">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Dashboard
         </Link>
         <Card className="max-w-4xl mx-auto">
            <CardHeader>
             <CardTitle>Summary Not Found</CardTitle>
           </CardHeader>
           <CardContent>
             <p>The requested summary could not be found.</p>
           </CardContent>
         </Card>
       </div>
    );
  }

  // --- Main Display --- 
  return (
    <div className="container py-8 mt-16">
      <Link href="/dashboard" className="inline-flex items-center text-sm mb-4 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">{summary.title}</CardTitle>
          <CardDescription>
            Generated on: {new Date(summary.createdAt).toLocaleString()} | Original File: {summary.originalFilename}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Generated Summary:</h3>
          <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/40 min-h-[150px]">
            {/* Render summary text */} 
            <p>{summary.summaryText}</p>
          </div>
        </CardContent>
        {/* Updated CardFooter */} 
        <CardFooter className="flex justify-end gap-2 pt-4">
           <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download Summary
            </Button>
            <Button variant="secondary" onClick={handleViewOriginal}>
              <FileText className="mr-2 h-4 w-4" /> View Original
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 