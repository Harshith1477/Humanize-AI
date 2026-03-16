import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Copy, RefreshCw } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const RECIPIENTS = ["Manager", "Client", "Professor", "Colleague", "Other"];
const TONES = ["Professional", "Friendly", "Casual"];

const EmailTab = () => {
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!purpose.trim()) return;
    setIsLoading(true);
    setSubject("");
    setBody("");

    try {
      // Try Supabase first
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: { purpose, recipient, tone },
      });

      if (error) {
        console.warn("Supabase generate-email failed, trying direct Gemini call:", error);
        
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
                text: `You are an expert email writer. Generate a professional email based on the user's request. The recipient is: ${recipient}. The tone should be: ${tone}. Return the result as JSON with two fields: "subject" (the email subject line) and "body" (the full email body). Return ONLY valid JSON, no markdown formatting, no code blocks.\n\nUser request: ${purpose}`
              }]
            }]
          }),
        });

        if (!response.ok) throw new Error(`Gemini direct API error: ${response.statusText}`);
        const geminiData = await response.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (match) {
            try {
              parsed = JSON.parse(match[1].trim());
            } catch {
              parsed = { subject: "Generated Email", body: content };
            }
          } else {
            parsed = { subject: "Generated Email", body: content };
          }
        }
        setSubject(parsed.subject || "");
        setBody(parsed.body || "");
      } else {
        setSubject(data?.subject || "");
        setBody(data?.body || "");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate email");
    } finally {
      setIsLoading(false);
    }
  }, [purpose, recipient, tone]);

  const handleCopy = useCallback(() => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, [subject, body]);

  return (
    <div className="flex flex-col h-full gap-6 max-w-3xl mx-auto w-full">
      <div className="animate-fade-in flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            Write Humanized Email
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate professional emails tailored to your audience and tone.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
          Unlimited Access
        </div>
      </div>

      <div className="flex flex-col gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Purpose
        </label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={4}
          placeholder="Describe what the email should be about…"
          className="input-modern"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recipient
          </label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="select-modern"
          >
            {RECIPIENTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="select-modern"
          >
            {TONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <Button onClick={handleGenerate} disabled={isLoading || !purpose.trim()} size="lg">
          <Mail size={18} />
          {isLoading ? "Generating…" : "Generate Email"}
        </Button>
        <Button variant="outline" onClick={handleCopy} disabled={!body}>
          <Copy size={16} />
          Copy
        </Button>
        <Button variant="outline" onClick={handleGenerate} disabled={isLoading || !purpose.trim()}>
          <RefreshCw size={16} />
          Regenerate
        </Button>
      </div>

      {isLoading && <LoadingSpinner />}

      {body && !isLoading && (
        <div className="flex flex-col gap-2 animate-fade-in-up">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated Email
          </label>
          <div className="glass-card rounded-xl p-5 leading-relaxed text-foreground text-[15px]">
            <p className="font-semibold text-primary mb-3">Subject: {subject}</p>
            <div className="whitespace-pre-wrap">{body}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTab;
