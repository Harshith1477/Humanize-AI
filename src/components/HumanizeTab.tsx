import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, RefreshCw } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const HumanizeTab = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleHumanize = useCallback(async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setOutput("");

    try {
      // Try Supabase first
      const { data, error } = await supabase.functions.invoke("humanize", {
        body: { text: input },
      });

      if (error) {
        console.warn("Supabase humanize failed, trying direct Gemini call:", error);
        
        // Fallback to direct Gemini call if API key exists
        const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!GEMINI_KEY || GEMINI_KEY === "REPLACE_WITH_YOUR_GEMINI_API_KEY") {
          throw new Error("Supabase connection failed and no local GEMINI_API_KEY found in .env");
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{
                text: `Rewrite the following text to sound like it was written by a real person. 

Rules:
- Keep it simple, natural, and slightly informal.
- Be concise and direct.
- Avoid generic AI clichés and "corporate speak" (e.g., avoid "passionate about", "leveraging technology", "make an impact", "tapping into", "rapidly evolving landscape").
- Use a human-like flow with varying sentence lengths.
- Maintain the original meaning but make it sound like a casual conversation or a personal note.
- Return ONLY the humanized text.

Text to humanize:
${input}`
              }]
            }]
          }),
        });

        if (!response.ok) throw new Error(`Gemini direct API error: ${response.statusText}`);
        const geminiData = await response.json();
        setOutput(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "");
      } else {
        setOutput(data?.result || "");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to humanize text");
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  }, [output]);

  return (
    <div className="flex flex-col h-full gap-6 max-w-3xl mx-auto w-full">
      <div className="animate-fade-in flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            Humanize AI Text
          </h2>
          <p className="text-sm text-muted-foreground">
            Transform AI-generated content into natural, human-sounding writing.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
          Unlimited Access
        </div>
      </div>

      <div className="flex flex-col gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex justify-between items-end">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Input Text
          </label>
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">No Word Limit</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="Paste AI-generated articles, emails, or essays here…"
          className="input-modern"
        />
      </div>

      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <Button onClick={handleHumanize} disabled={isLoading || !input.trim()} size="lg">
          <Sparkles size={18} />
          {isLoading ? "Humanizing…" : "Humanize"}
        </Button>
        <Button variant="outline" onClick={handleCopy} disabled={!output}>
          <Copy size={16} />
          Copy
        </Button>
        <Button variant="outline" onClick={handleHumanize} disabled={isLoading || !input.trim()}>
          <RefreshCw size={16} />
          Regenerate
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}

      {output && !isLoading && (
        <div className="flex flex-col gap-2 animate-fade-in-up">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </label>
          <div className="glass-card rounded-xl p-5 leading-relaxed text-foreground text-[15px]">
            {output}
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanizeTab;
