"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { History, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define a common type for history items
interface HistoryItem {
  id: string;
  type: 'Quiz' | 'Assignment' | 'Summary';
  title: string;
  createdAt: string; // Keep as string for simplicity, format later
  isOnlineAttempt?: boolean; // <-- Add optional field
}

// Define types for Supabase query results
interface QuizData {
  id: string;
  title: string;
  createdAt: string;
  isOnlineAttempt?: boolean;
}

interface AssignmentData {
  id: string;
  title: string;
  createdAt: string;
}

interface SummaryData {
  id: string;
  originalFilePath?: string;
  createdAt: string;
}

// Define props for the Sidebar
interface DashboardSidebarProps {
  refreshKey?: number;
  onClose?: () => void;
}

export default function DashboardSidebar({ refreshKey = 0, onClose }: DashboardSidebarProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn("Session error:", sessionError.message);
        }
        
        if (!session?.user) {
          console.info("No authenticated user found for history fetch.");
          setIsLoading(false);
          return;
        }
        
        const userId = session.user.id;

        // 2. Fetch Quizzes, Assignments, Summaries created by the user
        const quizPromise = supabase.from('Quiz').select('id, title, createdAt, isOnlineAttempt').eq('creatorId', userId).order('createdAt', { ascending: false }).limit(10);
        const assignmentPromise = supabase.from('Assignment').select('id, title, createdAt').eq('creatorId', userId).order('createdAt', { ascending: false }).limit(10);
        const summaryPromise = supabase.from('Summary').select('id, originalFilePath, createdAt').eq('creatorId', userId).order('createdAt', { ascending: false }).limit(10);

        // Use individual try-catch for each promise
        let quizData: QuizData[] = [];
        let assignmentData: AssignmentData[] = [];
        let summaryData: SummaryData[] = [];
        
        try {
          const quizRes = await quizPromise;
          if (quizRes.error) {
            console.warn("Error fetching quizzes:", quizRes.error);
          } else {
            quizData = quizRes.data || [];
          }
        } catch (err) {
          console.warn("Failed to fetch quizzes:", err);
        }
        
        try {
          const assignmentRes = await assignmentPromise;
          if (assignmentRes.error) {
            console.warn("Error fetching assignments:", assignmentRes.error);
          } else {
            assignmentData = assignmentRes.data || [];
          }
        } catch (err) {
          console.warn("Failed to fetch assignments:", err);
        }
        
        try {
          const summaryRes = await summaryPromise;
          if (summaryRes.error) {
            console.warn("Error fetching summaries:", summaryRes.error);
          } else {
            summaryData = summaryRes.data || [];
          }
        } catch (err) {
          console.warn("Failed to fetch summaries:", err);
        }

        // 3. Combine and Format Data
        const combined: HistoryItem[] = [
          ...(quizData.map(q => ({ 
             id: q.id, 
             type: 'Quiz' as const, 
             title: q.title || 'Untitled Quiz', 
             createdAt: q.createdAt, 
             isOnlineAttempt: q.isOnlineAttempt 
           })) || []),
          ...(assignmentData.map(a => ({ 
             id: a.id, 
             type: 'Assignment' as const, 
             title: a.title || 'Untitled Assignment', 
             createdAt: a.createdAt 
           })) || []),
          ...(summaryData.map(s => ({ 
             id: s.id, 
             type: 'Summary' as const, 
             title: `Summary: ${s.originalFilePath?.split('/').pop() || 'File'}`, 
             createdAt: s.createdAt 
           })) || [])
        ];

        // 4. Sort by Date (descending)
        combined.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        // 5. Limit total results (optional, e.g., show latest 20 items)
        setHistoryItems(combined.slice(0, 20));

      } catch (err: any) {
        console.error("Error fetching history:", err);
        setError(err.message || "Failed to load activity history.");
        setHistoryItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [refreshKey]); // <-- Add refreshKey to dependency array

  // Function to get the link for an item
  const getItemLink = (item: HistoryItem): string => {
    switch (item.type) {
      case 'Quiz': 
        return item.isOnlineAttempt ? `/quizzes/attempt/${item.id}` : `/quizzes/${item.id}`;
      case 'Assignment': 
        return `/assignments/${item.id}`;
      case 'Summary': 
        return `/summaries/${item.id}`;
      default: 
        return '#';
    }
  };

  return (
    <Card className="h-full flex flex-col pt-12">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4">
        <CardTitle className="text-lg font-semibold flex items-center">
            <History className="mr-2 h-5 w-5" />
            Activity History
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading history...</p>
          ) : error ? (
             <div className="text-sm text-destructive text-center py-4 flex items-center justify-center gap-2">
                 <AlertCircle className="h-4 w-4" />
                 <span>{error}</span>
             </div>
          ) : historyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No history yet.</p>
          ) : (
            <div className="space-y-3"> {/* Reduced spacing slightly */} 
              {historyItems.map((item) => (
                <Link href={getItemLink(item)} key={item.id} className="block p-3 border rounded-md hover:bg-accent transition-colors duration-150">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type} - {new Date(item.createdAt).toLocaleDateString()} {/* Format date */} 
                  </p>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 