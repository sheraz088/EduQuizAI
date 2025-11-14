"use client";

import { useState, useRef, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, BookOpen, Upload, Book, X, Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import axios from "axios";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UploadedFile {
  file: File;
  id: string;
  serverId?: string;
}

interface GeneratedContent {
  content: string;
  pdf_url: string;
  title: string;
  quizId?: string;
}

interface GeneratedContentWithType extends GeneratedContent {
  type: 'quiz' | 'assignment' | 'summary';
}

interface QuizState {
  title: string;
  files: UploadedFile[];
  type: "mcq" | "descriptive";
  numberOfQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  numberOfSolutions: number;
}

const initialQuizState: QuizState = {
  title: "",
  files: [] as UploadedFile[],
  type: "mcq",
  numberOfQuestions: 10,
  difficulty: "medium",
  numberOfSolutions: 1,
};

const initialAssignmentState = {
  title: "",
  files: [] as UploadedFile[],
  numberOfQuestions: 10,
};

const initialSummaryState = {
  files: [] as UploadedFile[],
};

const ResultDisplay = dynamic(() => 
  import('@/components/ResultDisplay').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="mt-8">
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse mb-4"></div>
            <div className="h-6 w-64 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
});

const FileListDisplay = ({ files, onRemove }: { 
  files: UploadedFile[], 
  onRemove: (id: string) => void 
}) => (
  <div className="space-y-2 mt-2">
    {files.map(({ file, id }) => (
      <div 
        key={id} 
        className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
      >
        <div className="flex items-center space-x-2 truncate">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onRemove(id)}
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ))}
  </div>
);

const renderTabContent = (content: React.ReactNode, key: string) => {
  return (
    <TabsContent value={key} key={key}>
      <div className="animate-fadeIn">
        {content}
      </div>
    </TabsContent>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentWithType | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'quiz' | 'assignment' | 'summary'>('quiz');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const quizFileRef = useRef<HTMLInputElement>(null);
  const assignmentFileRef = useRef<HTMLInputElement>(null);
  const summaryFileRef = useRef<HTMLInputElement>(null);

  const [quizState, setQuizState] = useState<QuizState>(initialQuizState);
  const [assignmentState, setAssignmentState] = useState(initialAssignmentState);
  const [summaryState, setSummaryState] = useState(initialSummaryState);

  useEffect(() => {
  const fetchUser = async () => {
     const { data: { session }, error: sessionError } = await supabase.auth.getSession();
     if (sessionError || !session) {
       console.error("Error fetching session or no session:", sessionError);
       setUser(null);
       return;
     }
     setUser(session.user);

    
    
  };
  fetchUser();
}, []);

  const handleFileUpload = useCallback((
    files: FileList | null,
    currentFiles: UploadedFile[],
    maxFiles: number = 5
  ): UploadedFile[] => {
    if (!files) return currentFiles;

    const newFiles = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}`
    }));

    const combinedFiles = [...currentFiles, ...newFiles];
    
    const uniqueFiles = combinedFiles.reduce((acc: UploadedFile[], current) => {
      const exists = acc.some(file => 
        file.file.name === current.file.name && 
        file.file.size === current.file.size
      );
      if (!exists) acc.push(current);
      return acc;
    }, []);

    return uniqueFiles.slice(0, maxFiles);
  }, []);

  const handleRemoveFile = useCallback((
    id: string,
    currentFiles: UploadedFile[],
    stateSetter: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const updatedFiles = currentFiles.filter(file => file.id !== id);
    stateSetter((prev: any) => ({
      ...prev,
      files: updatedFiles,
    }));
  }, []);
  
  const uploadFiles = useCallback(async (files: UploadedFile[]): Promise<string[]> => {
    if (files.length === 0) {
      throw new Error("No files to upload");
    }
    
    console.log("Uploading files:", files.map(f => f.file.name));
    
    const formData = new FormData();
    files.forEach(fileObj => {
      formData.append("files", fileObj.file);
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Sending files to ${API_URL}/api/upload/`);
      const response = await axios.post(`${API_URL}/api/upload/`, formData, {
        headers: headers
      });
      
      console.log("Upload response:", response.data);
      
      if (!response.data.files || response.data.files.length === 0) {
        console.error("No files returned from upload endpoint");
        throw new Error("No files were uploaded successfully");
      }
      
      files.forEach((file, index) => {
        if (response.data.files[index]) {
          file.serverId = response.data.files[index].id;
          console.log(`File ${file.file.name} assigned server ID: ${file.serverId}`);
        } else {
          console.warn(`No server ID returned for file ${file.file.name}`);
        }
      });

      return response.data.files.map((f: any) => f.id);
    } catch (error: any) {
      console.error("Error uploading files:", error);
      
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Creating mock file IDs for development/testing");
        return files.map(file => `mock-${Math.random().toString(36).substring(2, 15)}`);
      }
      
      throw new Error(`Failed to upload files: ${error.response?.data?.detail || error.message}`);
    }
  }, []);

const handleCreateQuiz = async () => {
  try {
    if (quizState.files.length === 0) {
      toast({
        title: "No files",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    if (!quizState.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      });
      return;
    }

    // Show processing toast
    toast({
      title: "Processing",
      description: "Uploading files and generating your quiz...",
    });

    setIsLoading(true);
    
    // Upload files first
    const fileIds: string[] = await uploadFiles(quizState.files);
    
    // Get authentication session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Use the generate endpoint for regular quizzes
    const response = await axios.post(`${API_URL}/api/generate/`, {
  title: quizState.title,
  numberOfQuestions: quizState.numberOfQuestions,
  type: quizState.type,
  difficulty: quizState.difficulty,
  numberOfSolutions: quizState.numberOfSolutions,
}, {
  headers: headers,
  params: {
    file_ids: fileIds.join(',')
  }
});

    
    // Handle regular quiz response
    const content = response.data;
    setGeneratedContent({
      content: content.content,
      pdf_url: content.pdf_url,
      title: quizState.title,
      quizId: content.quizId,
      type: 'quiz'
    });
    
    // Show success toast after everything is done
    toast({
      title: "Success",
      description: "Quiz generated successfully!",
    });
    
    setShowResults(true);
    setHistoryRefreshKey(prev => prev + 1);
    
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    
    let errorMessage = "Unknown error occurred";
    if (error.response) {
      errorMessage = error.response.data?.detail || error.response.statusText;
    } else if (error.request) {
      errorMessage = "No response received from server";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Error creating quiz",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
const handleCreateAssignment = async () => {
  try {
    if (assignmentState.files.length === 0) {
      toast({
        title: "No files",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    if (!assignmentState.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your assignment",
        variant: "destructive",
      });
      return;
    }

    toast({ 
      title: "Processing", 
      description: "Uploading files and creating your assignment..." 
    });

    setIsLoading(true);
    
    const fileIds: string[] = await uploadFiles(assignmentState.files);
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${API_URL}/api/generate/`, {
      title: assignmentState.title,
      numberOfQuestions: assignmentState.numberOfQuestions,
      type: "assignment"
    }, {
      headers: headers,
      params: {
        file_ids: fileIds.join(',')
      }
    });
    
    const content = response.data;
    setGeneratedContent({
      content: content.content,
      pdf_url: content.pdf_url,
      title: assignmentState.title,
      type: 'assignment'
    });
    
    toast({ 
      title: "Success", 
      description: "Assignment generated successfully!" 
    });
    
    setShowResults(true);
    setHistoryRefreshKey(prev => prev + 1);
    
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    
    let errorMessage = "Unknown error occurred";
    if (error.response) {
      errorMessage = error.response.data?.detail || error.response.statusText;
    } else if (error.request) {
      errorMessage = "No response received from server";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Error creating assignment",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

const handleGenerateSummary = async () => {
  try {
    if (summaryState.files.length === 0) {
      toast({
        title: "No files",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    toast({ 
      title: "Processing", 
      description: "Uploading files and generating your summary..." 
    });

    setIsLoading(true);
    
    const fileIds: string[] = await uploadFiles(summaryState.files);
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${API_URL}/api/generate/`, {
      title: "Document Summary",
      type: "summary"
    }, {
      headers: headers,
      params: {
        file_ids: fileIds.join(',')
      }
    });
    
    const content = response.data;
    setGeneratedContent({
      content: content.content,
      pdf_url: content.pdf_url,
      title: "Document Summary",
      type: 'summary'
    });
    
    toast({ 
      title: "Success", 
      description: "Summary generated successfully!" 
    });
    
    setShowResults(true);
    setHistoryRefreshKey(prev => prev + 1);
    
  } catch (error: any) {
    console.error("Error generating summary:", error);
    
    let errorMessage = "Unknown error occurred";
    if (error.response) {
      errorMessage = error.response.data?.detail || error.response.statusText;
    } else if (error.request) {
      errorMessage = "No response received from server";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Error generating summary",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <>
      <main className="container pt-8 pb-12 mt-16 transition-all duration-300 ease-in-out px-4">
        {user && (
          <h1 className="text-xl md:text-2xl font-semibold mb-8 text-center">
            Welcome, {user.user_metadata?.full_name || user.email}!
          </h1>
        )}

        <Tabs
          defaultValue="quiz"
          className="space-y-6"
          onValueChange={(value) => setActiveTab(value as 'quiz' | 'assignment' | 'summary')}
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {renderTabContent(
            <>
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle>Create Quiz</CardTitle>
                  <CardDescription>Generate MCQ or descriptive quizzes from your files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input
                      id="quiz-title"
                      placeholder="Enter quiz title"
                      value={quizState.title}
                      onChange={(e) => setQuizState(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="quiz-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      ref={quizFileRef}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          if (files.length > 5) {
                            toast({
                              title: "Limit Exceeded",
                              description: "Please select a maximum of 5 files.",
                              variant: "destructive",
                            });
                            if (quizFileRef.current) quizFileRef.current.value = "";
                          } else {
                            setQuizState(prev => ({
                              ...prev,
                              files: handleFileUpload(files, prev.files)
                            }));
                          }
                        }
                      }}
                    />
                    <Label htmlFor="quiz-file">Upload File(s) (Max 5)</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => quizFileRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File(s)
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {quizState.files.length} file(s) selected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Supported formats: PDF, DOCX, PPT, TXT
                    </p>
                    {quizState.files.length > 0 && (
                      <FileListDisplay 
                        files={quizState.files} 
                        onRemove={(id) => handleRemoveFile(id, quizState.files, setQuizState)}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Quiz Type</Label>
                    <div className="flex space-x-4">
                      <Button
                        variant={quizState.type === "mcq" ? "default" : "outline"}
                        onClick={() => setQuizState(prev => ({ ...prev, type: "mcq" }))}
                      >
                        MCQ
                      </Button>
                      <Button
                        variant={quizState.type === "descriptive" ? "default" : "outline"}
                        onClick={() => setQuizState(prev => ({ ...prev, type: "descriptive" }))}
                      >
                        Descriptive
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <div className="flex space-x-4">
                      <Button
                        variant={quizState.difficulty === "easy" ? "default" : "outline"}
                        onClick={() => setQuizState(prev => ({ ...prev, difficulty: "easy" }))}
                      >
                        Easy
                      </Button>
                      <Button
                        variant={quizState.difficulty === "medium" ? "default" : "outline"}
                        onClick={() => setQuizState(prev => ({ ...prev, difficulty: "medium" }))}
                      >
                        Medium
                      </Button>
                      <Button
                        variant={quizState.difficulty === "hard" ? "default" : "outline"}
                        onClick={() => setQuizState(prev => ({ ...prev, difficulty: "hard" }))}
                      >
                        Hard
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label htmlFor="num-questions">Number of Questions: {quizState.numberOfQuestions}</Label>
                    <Slider
                      id="num-questions"
                      min={1}
                      max={25}
                      step={1}
                      value={[quizState.numberOfQuestions]}
                      onValueChange={(value: number[]) => setQuizState(prev => ({ ...prev, numberOfQuestions: value[0] }))}
                      className="pt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number-of-solutions">Number of Solutions</Label>
                    <Select
                      value={quizState.numberOfSolutions.toString()}
                      onValueChange={(value) => setQuizState(prev => ({ ...prev, numberOfSolutions: parseInt(value) }))}
                    >
                      <SelectTrigger id="number-of-solutions" className="w-full">
                        <SelectValue placeholder="Select number of solutions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Solution</SelectItem>
                        <SelectItem value="2">2 Solutions</SelectItem>
                        <SelectItem value="3">3 Solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-6 flex justify-center">
                    <div className="transform transition-transform hover:scale-105 active:scale-95">
                      <Button className="w-full" onClick={handleCreateQuiz} disabled={isLoading}>
                        {isLoading ? "Creating Quiz..." : <> <BookOpen className="mr-2 h-4 w-4" /> Create Quiz </>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>,
            'quiz'
          )}

          {renderTabContent(
            <>
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle>Create Assignment</CardTitle>
                  <CardDescription>Generate assignments from your files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-title">Assignment Title</Label>
                    <Input
                      id="assignment-title"
                      placeholder="Enter assignment title"
                      value={assignmentState.title}
                      onChange={(e) => setAssignmentState(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      id="assignment-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      ref={assignmentFileRef}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          if (files.length > 5) {
                            toast({
                              title: "Limit Exceeded",
                              description: "Please select a maximum of 5 files.",
                              variant: "destructive",
                            });
                            if (assignmentFileRef.current) assignmentFileRef.current.value = "";
                          } else {
                            setAssignmentState(prev => ({
                              ...prev,
                              files: handleFileUpload(files, prev.files)
                            }));
                          }
                        }
                      }}
                    />
                    <Label htmlFor="assignment-file">Upload File(s) (Max 5)</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => assignmentFileRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File(s)
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {assignmentState.files.length} file(s) selected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Supported formats: PDF, DOCX, PPT, TXT
                    </p>
                    {assignmentState.files.length > 0 && (
                      <FileListDisplay 
                        files={assignmentState.files} 
                        onRemove={(id) => handleRemoveFile(id, assignmentState.files, setAssignmentState)}
                      />
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label htmlFor="num-assignment-questions">Number of Questions: {assignmentState.numberOfQuestions}</Label>
                    <Slider
                      id="num-assignment-questions"
                      min={1}
                      max={25}
                      step={1}
                      value={[assignmentState.numberOfQuestions]}
                      onValueChange={(value: number[]) => setAssignmentState(prev => ({ ...prev, numberOfQuestions: value[0] }))}
                      className="pt-2"
                    />
                  </div>

                  <div className="pt-6 flex justify-center">
                    <div className="transform transition-transform hover:scale-105 active:scale-95">
                      <Button className="w-full" onClick={handleCreateAssignment} disabled={isLoading}>
                        {isLoading ? "Creating Assignment..." : <> <FileText className="mr-2 h-4 w-4" /> Create Assignment </>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>,
            'assignment'
          )}

          {renderTabContent(
            <>
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle>Generate Summary</CardTitle>
                  <CardDescription>Generate summaries from your files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Input
                      id="summary-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      ref={summaryFileRef}
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          if (files.length > 5) {
                            toast({
                              title: "Limit Exceeded",
                              description: "Please select a maximum of 5 files.",
                              variant: "destructive",
                            });
                            if (summaryFileRef.current) summaryFileRef.current.value = "";
                          } else {
                            setSummaryState(prev => ({
                              ...prev,
                              files: handleFileUpload(files, prev.files)
                            }));
                          }
                        }
                      }}
                    />
                    <Label htmlFor="summary-file">Upload File(s) (Max 5)</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => summaryFileRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File(s)
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {summaryState.files.length} file(s) selected
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Supported formats: PDF, DOCX, PPT, TXT
                    </p>
                    {summaryState.files.length > 0 && (
                      <FileListDisplay 
                        files={summaryState.files} 
                        onRemove={(id) => handleRemoveFile(id, summaryState.files, setSummaryState)}
                      />
                    )}
                  </div>

                  <div className="pt-6 flex justify-center">
                    <div className="transform transition-transform hover:scale-105 active:scale-95">
                      <Button className="w-full" onClick={handleGenerateSummary} disabled={isLoading}>
                        {isLoading ? "Generating Summary..." : <> <Book className="mr-2 h-4 w-4" /> Generate Summary </>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>,
            'summary'
          )}
        </Tabs>

        {showResults && generatedContent && generatedContent.type === activeTab && (
          <ResultDisplay generatedContent={generatedContent} />
        )}
      </main>
    </>
  );
}