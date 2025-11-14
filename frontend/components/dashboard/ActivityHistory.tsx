import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, Award, Clock, BookCheck, ArrowUpRight, BookType, FileStack, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import axios from 'axios';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// Use environment variable for API URL or fallback to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UserActivity {
  id: string;
  userId: string;
  activityType: string;
  entityId: string | null;
  entityType: string | null;
  details: string | null;
  timestamp: string;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'CREATED_QUIZ':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'ATTEMPTED_QUIZ':
      return <Award className="h-4 w-4 text-green-500" />;
    case 'VIEWED_QUIZ':
      return <BookOpen className="h-4 w-4 text-purple-500" />;
    case 'CREATED_ASSIGNMENT':
      return <FileStack className="h-4 w-4 text-orange-500" />;
    case 'SUBMITTED_ASSIGNMENT':
      return <BookCheck className="h-4 w-4 text-cyan-500" />;
    case 'GENERATED_SUMMARY':
      return <BookType className="h-4 w-4 text-rose-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityTypeLabel = (activityType: string) => {
  switch (activityType) {
    case 'CREATED_QUIZ':
      return 'Created Quiz';
    case 'ATTEMPTED_QUIZ':
      return 'Attempted Quiz';
    case 'VIEWED_QUIZ':
      return 'Viewed Quiz';
    case 'CREATED_ASSIGNMENT':
      return 'Created Assignment';
    case 'SUBMITTED_ASSIGNMENT':
      return 'Submitted Assignment';
    case 'GENERATED_SUMMARY':
      return 'Generated Summary';
    default:
      return 'Activity';
  }
};

const getActivityDetailsColor = (activityType: string) => {
  switch (activityType) {
    case 'CREATED_QUIZ':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'ATTEMPTED_QUIZ':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'VIEWED_QUIZ':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'CREATED_ASSIGNMENT':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'SUBMITTED_ASSIGNMENT':
      return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
    case 'GENERATED_SUMMARY':
      return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const ActivityHistory = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Add useCallback for fetch function
  const fetchUserActivities = useCallback(async (userId: string, token: string) => {
    // Skip the API call entirely in development mode to avoid 403 errors
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Using mock activity data instead of API call");
      return [
        {
          id: "mock-1",
          userId: userId,
          activityType: "CREATED_QUIZ",
          entityId: "mock-quiz-1",
          entityType: "QUIZ",
          details: "Created a new quiz: JavaScript Basics",
          timestamp: new Date().toISOString()
        },
        {
          id: "mock-2",
          userId: userId,
          activityType: "ATTEMPTED_QUIZ",
          entityId: "mock-quiz-2",
          entityType: "QUIZ",
          details: "Scored 80% on quiz: React Fundamentals",
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "mock-3",
          userId: userId,
          activityType: "VIEWED_QUIZ",
          entityId: "mock-quiz-3",
          entityType: "QUIZ",
          details: "Viewed quiz: CSS Animations",
          timestamp: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: "mock-4",
          userId: userId,
          activityType: "GENERATED_SUMMARY",
          entityId: "mock-summary-1",
          entityType: "SUMMARY",
          details: "Generated summary from document: Web Development Best Practices",
          timestamp: new Date(Date.now() - 259200000).toISOString()
        }
      ];
    }

    // Production mode - make the actual API call
    try {
      console.log("Making API call to fetch activities");
      
      // Create a controller to abort the request if needed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Fetch activities from the backend with proper headers
      const response = await axios.get(
        `${API_URL}/api/user-activity/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      // Validate response
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn("Unexpected response format:", response.data);
        return [];
      }
    } catch (error: any) {
      // Don't log the 403 error as it's expected when not authenticated
      if (error.response?.status !== 403) {
        console.error("API error:", error.message);
      } else {
        console.log("Authentication required for activity history");
      }
      return [];
    }
  }, []);

  useEffect(() => {
    const checkAuthAndFetchActivities = async () => {
      setIsLoading(true);
      
      try {
        // Check if we have a user session
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (!session || !session.user) {
          console.log("No active session found - user not authenticated");
          setIsAuthenticated(false);
          setActivities([]);
          setIsLoading(false);
          return;
        }
        
        // User is authenticated
        setIsAuthenticated(true);
        
        // Check if we have a valid token
        const userId = session.user.id;
        const token = session.access_token;
        
        if (!token) {
          console.warn("No authentication token available");
          setActivities([]);
          setIsLoading(false);
          return;
        }
        
        // Use the callback to fetch activities
        const userActivities = await fetchUserActivities(userId, token);
        setActivities(userActivities);
      } catch (error) {
        console.error("Session error:", error);
        setIsAuthenticated(false);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Run the check immediately
    checkAuthAndFetchActivities();
    
    // Also set up auth state change listener for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        checkAuthAndFetchActivities();
      } else {
        setIsAuthenticated(false);
        setActivities([]);
      }
    });
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserActivities]);
  
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.activityType === filter);
  
  // Handle navigation to entity
  const navigateToEntity = (activity: UserActivity) => {
    if (!activity.entityId) return;
    
    let url;
    switch (activity.entityType) {
      case 'QUIZ':
        if (activity.activityType === 'ATTEMPTED_QUIZ' || activity.activityType === 'VIEWED_QUIZ') {
          url = `/quizzes/attempt/${activity.entityId}`;
        } else {
          url = `/quizzes/${activity.entityId}`;
        }
        break;
      case 'ASSIGNMENT':
        url = `/assignments/${activity.entityId}`;
        break;
      case 'SUMMARY':
        url = `/summaries/${activity.entityId}`;
        break;
      default:
        return;
    }
    
    // Use window.location for navigation
    window.location.href = url;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  // Display authentication required UI if not authenticated
  if (isAuthenticated === false) {
    return (
      <Card className="w-full overflow-hidden edu-card-gradient">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
          <CardDescription>
            Track your recent activities and progress
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-center p-6">
            <LogIn className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Please sign in to view your activity history
            </p>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="edu-btn-gradient"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden edu-card-gradient">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Clock className="h-5 w-5" />
          Activity History
        </CardTitle>
        <CardDescription>
          Track your recent activities and progress
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" className="px-4">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
          <TabsTrigger value="quizzes" onClick={() => setFilter('ATTEMPTED_QUIZ')}>Quizzes</TabsTrigger>
          <TabsTrigger value="created" onClick={() => setFilter('CREATED_QUIZ')}>Created</TabsTrigger>
          <TabsTrigger value="summaries" onClick={() => setFilter('GENERATED_SUMMARY')}>Summaries</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <CardContent>
        <ScrollArea className="h-[350px] pr-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      variants={itemVariants}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="bg-muted h-8 w-8 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.activityType)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getActivityDetailsColor(activity.activityType)}>
                            {getActivityTypeLabel(activity.activityType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp ? format(new Date(activity.timestamp), 'MMM dd, yyyy • HH:mm') : 'Unknown date'}
                          </span>
                        </div>
                        
                        <p className="text-sm">{activity.details || 'No details available'}</p>
                        
                        {activity.entityId && (
                          <div className="pt-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => navigateToEntity(activity)}
                            >
                              View details <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-40 text-center p-4"
                  >
                    <Clock className="h-10 w-10 text-muted-foreground mb-2 opacity-40" />
                    <p className="text-muted-foreground">No activities found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filter === 'all' 
                        ? 'Complete some actions to see your activity history' 
                        : 'Try selecting a different filter'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityHistory; 