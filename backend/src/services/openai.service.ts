import OpenAI from "openai";
import { env } from "@/config/env";
import { retryAsync } from "@/utils/helpers";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export class OpenAIService {
  async generateScript(idea: string) {
    const prompt = `You are an expert product marketer and UX designer.
Create a demo video script for the following idea: "${idea}"
Respond ONLY in JSON matching this schema:
{
  "hook": "string (catchy intro)",
  "flow": ["string (step 1)", "string (step 2)"],
  "ending": "string (closing statement)",
  "interactions": [
    { "type": "click", "selector": "string (css selector)", "delay": "number (ms)" },
    { "type": "type", "selector": "string", "text": "string", "delay": "number" }
  ]
}`;

    return retryAsync(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const content = response.choices[0].message.content;
      return JSON.parse(content || "{}");
    });
  }

  async generateUICode(scriptContext: any) {
    const prompt = `You are an expert frontend engineer. Create a beautiful, modern, single-file HTML/CSS/JS (React optional, via CDN) UI that demonstrates this script.
Ensure the CSS selectors defined in the interactions actually exist in the HTML.
Interactions context constraints:
${JSON.stringify(scriptContext.interactions)}

Return ONLY valid HTML code. No markdown formatting.`;

    return retryAsync(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      let html = response.choices[0].message.content || "";
      if (html.startsWith("\`\`\`html")) {
        html = html.replace(/\`\`\`html/g, "").replace(/\`\`\`/g, "");
      }
      return html.trim();
    });
  }
}
