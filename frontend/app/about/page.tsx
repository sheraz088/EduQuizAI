import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Brain, Users, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About EduQuizAI</h1>
        <p className="text-xl text-muted-foreground">
          Transforming education through innovative AI-powered assessment tools
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="p-6">
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Our Mission</h3>
            </div>
            <p className="text-muted-foreground">
              To revolutionize educational assessment by leveraging artificial intelligence,
              making it easier for educators to create, manage, and grade assessments while
              providing valuable insights into student learning.
            </p>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Target className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Our Vision</h3>
            </div>
            <p className="text-muted-foreground">
              To become the leading platform for AI-powered educational assessment,
              empowering educators worldwide to deliver more effective and personalized
              learning experiences.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose EduQuizAI?</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI-Powered Intelligence</h3>
            <p className="text-muted-foreground">
              Advanced algorithms that understand context and generate relevant questions
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Educational Expertise</h3>
            <p className="text-muted-foreground">
              Developed in collaboration with educators for real classroom needs
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">User-Centric Design</h3>
            <p className="text-muted-foreground">
              Intuitive interface that makes assessment creation and management effortless
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}