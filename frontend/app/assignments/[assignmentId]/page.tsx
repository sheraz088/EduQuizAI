"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { useState, useEffect } from "react"; // Added hooks

// Interface for assignment data (adjust based on API)
interface AssignmentData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // Assuming ISO string from API
  originalFilename?: string; // Optional
  filePath?: string; // Optional
  // Add other fields as needed
}

export default function AssignmentViewPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) {
        setIsLoading(false);
        setError("Invalid Assignment ID.");
        return;
    }

    const fetchAssignment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- TODO: Replace with actual API call --- 
        // const response = await fetch(`/api/assignments/${assignmentId}`);
        // if (!response.ok) { throw new Error(`Failed to fetch assignment (status: ${response.status})`); }
        // const data: AssignmentData = await response.json();
        
        // Mock data for now:
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data: AssignmentData = {
          id: assignmentId,
          title: `Assignment: ${assignmentId}`,
          description: "This is mock description fetched for the assignment.",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
          originalFilename: "mock_document.pdf"
        };
        // --- End Replace --- 
        
        setAssignment(data);
      } catch (err: any) {
        console.error("Error fetching assignment:", err);
        setError(err.message || "Failed to load assignment data.");
        setAssignment(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  // --- TODO: Implement Button Actions --- 
  const handleDownload = () => {
    console.log("Download Assignment clicked (TODO: Implement)");
    // Add logic to download assignment file (e.g., using assignment.filePath)
  };
  const handleViewOriginal = () => {
     console.log("View Original clicked (TODO: Implement)");
     // Add logic to view original document (e.g., open assignment.filePath in new tab)
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
             <CardTitle className="text-destructive">Error Loading Assignment</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-destructive">{error}</p>
           </CardContent>
         </Card>
       </div>
    );
  }
  
  // Not Found State
  if (!assignment) {
     return (
       <div className="container py-8 mt-16">
         <Link href="/dashboard" className="inline-flex items-center text-sm mb-4 hover:underline">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Dashboard
         </Link>
         <Card className="max-w-4xl mx-auto">
            <CardHeader>
             <CardTitle>Assignment Not Found</CardTitle>
           </CardHeader>
           <CardContent>
             <p>The requested assignment could not be found.</p>
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
          <CardTitle className="text-2xl md:text-3xl">{assignment.title}</CardTitle>
          <CardDescription>
            {assignment.dueDate ? `Due Date: ${new Date(assignment.dueDate).toLocaleDateString()}` : "No due date"}
            {assignment.originalFilename && ` | Original File: ${assignment.originalFilename}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Instructions/Content:</h3>
          <p className="text-muted-foreground">
            {assignment.description || "No description provided."} 
          </p>
          <div className="border p-4 rounded-md bg-muted/40 min-h-[100px]">
            <p className="text-sm text-center text-muted-foreground">
              {/* TODO: Replace placeholder with actual content display logic (e.g., iframe, link) */} 
              [Assignment Content Area]
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-4">
           <Button variant="outline" onClick={handleDownload}>
             <Download className="mr-2 h-4 w-4" /> Download Assignment
           </Button>
           {/* Conditionally render View Original if path exists */} 
           {assignment.filePath && (
             <Button variant="secondary" onClick={handleViewOriginal}>
                <FileText className="mr-2 h-4 w-4" /> View Original
             </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
} 