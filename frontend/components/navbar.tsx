"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    console.log("Navbar useEffect: Checking session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Navbar getSession Result:", session);
        setIsAuthenticated(!!session);
        setIsLoading(false);
        console.log("Navbar getSession: isLoading=false, isAuthenticated=", !!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Navbar Auth Event:", event, session);
      setIsAuthenticated(!!session);
      setIsLoading(false);
      console.log("Navbar onAuthStateChange: isLoading=false, isAuthenticated=", !!session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold text-xl">EduQuizAI</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          {isLoading ? (
            <>
             <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
             <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </>
          ) : isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            !pathname.startsWith("/auth") && (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="hover:opacity-90">Register</Button>
                </Link>
              </>
            )
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}