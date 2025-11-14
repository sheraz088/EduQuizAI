import { Button } from "@/components/ui/button";
import { Brain, FileText, Download, ListChecks } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center bg-background">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Transform Education with AI
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8">
          Create, manage, and download quizzes effortlessly with our AI-powered
          platform. Perfect for teachers and students.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/register">
            <Button size="lg" className="hover:opacity-90">Get Started</Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline" className="hover:bg-accent hover:text-accent-foreground">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-background rounded-lg shadow-lg">
              <Brain className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                AI-Powered Quiz Generation
              </h3>
              <p className="text-muted-foreground">
                Create quizzes automatically using advanced AI algorithms
              </p>
            </div>

            <div className="p-6 bg-background rounded-lg shadow-lg">
              <FileText className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                Multi-format Support
              </h3>
              <p className="text-muted-foreground">
                Extract content from PDF, DOCX, PPT, and more
              </p>
            </div>

            <div className="p-6 bg-background rounded-lg shadow-lg">
              <Download className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                PDF Export
              </h3>
              <p className="text-muted-foreground">
                Download your generated quizzes as PDF documents
              </p>
            </div>

            <div className="p-6 bg-background rounded-lg shadow-lg">
              <ListChecks className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                Multiple Question Types
              </h3>
              <p className="text-muted-foreground">
                Create MCQs and descriptive questions from your content
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}