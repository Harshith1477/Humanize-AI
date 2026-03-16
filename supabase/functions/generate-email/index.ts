import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { purpose, recipient, tone } = await req.json();
    if (!purpose) throw new Error("No purpose provided");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `You are an expert email writer. Generate a professional email based on the user's request. The recipient is: ${recipient}. The tone should be: ${tone}. Return the result as JSON with two fields: "subject" (the email subject line) and "body" (the full email body). Return ONLY valid JSON, no markdown formatting, no code blocks.\n\nUser request: ${purpose}`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      throw new Error(`Gemini API error ${status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block if applicable
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

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
