"use client";

import React, { useState, useEffect } from "react";
import { generatePersonalizedGreeting } from "@/ai/flows/personalized-time-of-day-greeting-flow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [customText, setCustomText] = useState("Hello world");
  const [userName, setUserName] = useState("");
  const [aiGreeting, setAiGreeting] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchGreeting() {
      setIsLoading(true);
      try {
        const result = await generatePersonalizedGreeting({ userName: userName || undefined });
        setAiGreeting(result.greeting);
      } catch (error) {
        console.error("Failed to fetch AI greeting", error);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchGreeting();
    }, 500);

    return () => clearTimeout(timer);
  }, [userName]);

  return (
    <div className="grid grid-cols-[1fr_360px] min-h-screen font-body">
      {/* Main Content Area (1fr) */}
      <main className="flex flex-col items-center justify-center p-24 bg-background overflow-hidden relative">
        <div className="max-w-2xl w-full space-y-12 flex flex-col items-center text-center">
          
          {/* Personalized AI Greeting */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium opacity-60">
              Personalized for you
            </span>
            <h2 className={`text-2xl md:text-3xl font-light text-foreground/80 fade-in min-h-[1.5em] transition-all duration-700 ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
              {aiGreeting || "Preparing your greeting..."}
            </h2>
          </div>

          <Separator className="w-12 bg-primary/20" />

          {/* Basic Display / Custom Text */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-headline font-light tracking-tight text-foreground transition-all duration-500">
              {customText}
            </h1>
          </div>
        </div>
      </main>

      {/* Control Panel (360px) */}
      <aside className="surface-1 thin-border-l p-12 flex flex-col justify-start space-y-12 z-10 border-l border-white/5">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-primary">Customization</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tailor the atmosphere of your sunrise display.
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="custom-text" className="text-xs uppercase tracking-widest text-muted-foreground">
              Display Message
            </Label>
            <Input
              id="custom-text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter message..."
              className="bg-secondary/50 border-white/5 focus-visible:ring-primary h-12"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="user-name" className="text-xs uppercase tracking-widest text-muted-foreground">
              Your Name
            </Label>
            <Input
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Who are we greeting?"
              className="bg-secondary/50 border-white/5 focus-visible:ring-primary h-12"
            />
          </div>
        </div>

        <div className="mt-auto pt-12">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium opacity-40">
            Hello Sunrise &copy; 2024
          </p>
        </div>
      </aside>
    </div>
  );
}
