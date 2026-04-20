import OpenAI from "openai";
import { env } from "@/config/env";
import { retryAsync } from "@/utils/helpers";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const interactionSchema = z.object({
  type: z.enum(["click", "type", "hover", "scroll"]),
  selector: z.string().min(1),
  text: z.string().optional(),
  delay: z.number().int().min(0).max(6000).default(500),
});

const generatedScriptSchema = z.object({
  hook: z.string().min(10),
  flow: z.array(z.string()).default([]),
  beats: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        narration: z.string(),
        onScreenText: z.string(),
        durationSec: z.number().int().min(1).max(20),
      })
    )
    .min(3)
    .max(8),
  ending: z.string().min(8),
  cta: z.string().min(5),
  voiceoverLines: z
    .array(
      z.object({
        atSecond: z.number().min(0),
        line: z.string().min(1),
        emphasis: z.string().optional(),
      })
    )
    .min(3),
  shotPlan: z
    .array(
      z.object({
        beatId: z.string(),
        camera: z.string(),
        focus: z.string(),
      })
    )
    .min(3),
  interactions: z.array(interactionSchema).min(2),
  captions: z
    .array(
      z.object({
        atSecond: z.number().min(0),
        text: z.string().min(1),
      })
    )
    .min(3),
  renderConfig: z.object({
    aspectRatio: z.enum(["16:9", "9:16"]),
    platform: z.enum(["instagram_reels", "tiktok", "youtube_shorts"]),
    durationSec: z.number().int().min(15).max(90),
    fps: z.number().int().default(30),
  }),
  qualityScore: z.object({
    hookStrength: z.number().int().min(1).max(10),
    retention: z.number().int().min(1).max(10),
    novelty: z.number().int().min(1).max(10),
    clarity: z.number().int().min(1).max(10),
  }),
});

type CreativeOptions = {
  platform?: "instagram_reels" | "tiktok" | "youtube_shorts";
  aspectRatio?: "16:9" | "9:16";
  tone?: "premium" | "bold" | "playful" | "crazy";
  durationSec?: number;
  audience?: string;
};

const defaultCreativeOptions: Required<CreativeOptions> = {
  platform: "youtube_shorts",
  aspectRatio: "16:9",
  tone: "crazy",
  durationSec: 45,
  audience: "founders and product teams",
};

export class OpenAIService {
  private getScriptSystemPrompt() {
    return `You are "Chaos Director", an elite short-form product storyteller.
Your job is to turn ideas into addictive product demo stories that feel cinematic, bold, and impossible to ignore.

Rules:
1. Think in retention beats: 0-2s HOOK, 3-10s setup, 11-30s transformation demo, closing CTA.
2. Every beat needs narration and visual intent.
3. Interactions must be executable in browser automation.
4. Use fresh, specific language. No generic buzzwords.
5. Return ONLY valid JSON.`;
  }

  private getScriptUserPrompt(idea: string, creative: Required<CreativeOptions>) {
    return `Build a high-quality short-form demo script.

Idea:
"${idea}"

Creative Direction:
- platform: ${creative.platform}
- aspectRatio: ${creative.aspectRatio}
- tone: ${creative.tone}
- audience: ${creative.audience}
- durationSec: ${creative.durationSec}

Return JSON with EXACT keys:
{
  "hook": "string",
  "flow": ["string"],
  "beats": [{"id":"b1","title":"string","narration":"string","onScreenText":"string","durationSec":number}],
  "ending": "string",
  "cta": "string",
  "voiceoverLines": [{"atSecond": number, "line": "string", "emphasis": "string"}],
  "shotPlan": [{"beatId":"b1","camera":"string","focus":"string"}],
  "interactions": [{"type":"click|type|hover|scroll","selector":"string","text":"string optional","delay":number}],
  "captions": [{"atSecond": number, "text": "string"}],
  "renderConfig": {"aspectRatio":"16:9|9:16","platform":"instagram_reels|tiktok|youtube_shorts","durationSec":number,"fps":30},
  "qualityScore": {"hookStrength": number, "retention": number, "novelty": number, "clarity": number}
}`;
  }

  private parseJson<T>(content: string | null): T {
    return JSON.parse(content || "{}");
  }

  private normalizeScript(raw: z.infer<typeof generatedScriptSchema>) {
    const flow = raw.flow?.length
      ? raw.flow
      : raw.beats.map((beat) => `${beat.title}: ${beat.narration}`);

    const interactions = raw.interactions.map((interaction) => ({
      ...interaction,
      delay: Math.max(0, Math.min(interaction.delay ?? 500, 6000)),
      selector: interaction.selector.trim(),
    }));

    return {
      ...raw,
      flow,
      interactions,
    };
  }

  async generateScript(idea: string, creativeInput?: CreativeOptions) {
    const creative = { ...defaultCreativeOptions, ...(creativeInput || {}) };

    return retryAsync(async () => {
      const draftResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.getScriptSystemPrompt() },
          { role: "user", content: this.getScriptUserPrompt(idea, creative) },
        ],
        response_format: { type: "json_object" },
      });

      const draft = this.parseJson<Record<string, unknown>>(draftResponse.choices[0].message.content);

      const reviewResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a creative director QA system. Improve retention, novelty, and clarity. Keep output in the exact same JSON schema. Return only JSON.",
          },
          {
            role: "user",
            content: `Polish this draft while preserving intent and making it crazier-but-clear. Ensure executable interactions and platform-ready pacing.\n\n${JSON.stringify(
              draft
            )}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const polished = this.parseJson<Record<string, unknown>>(reviewResponse.choices[0].message.content);
      const parsed = generatedScriptSchema.safeParse(polished);

      if (!parsed.success) {
        throw new Error(`Invalid script JSON generated: ${parsed.error.message}`);
      }

      return this.normalizeScript(parsed.data);
    });
  }

  private selectorExistsInHtml(html: string, selector: string) {
    const trimmed = selector.trim();
    if (!trimmed) return false;

    if (trimmed.startsWith("#")) {
      const id = trimmed.slice(1).split(/[\s>.+:[\]]/)[0];
      return new RegExp(`id=["']${id}["']`, "i").test(html);
    }

    if (trimmed.startsWith(".")) {
      const className = trimmed.slice(1).split(/[\s>.+:[\]]/)[0];
      return new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, "i").test(html);
    }

    if (trimmed.startsWith("[")) {
      const attrMatch = trimmed.match(/^\[([^=\]]+)(=["']?([^"'\]]+)["']?)?\]$/);
      if (!attrMatch) return html.includes(trimmed);
      const attrName = attrMatch[1];
      const attrValue = attrMatch[3];
      if (!attrValue) return new RegExp(`${attrName}=`, "i").test(html);
      return new RegExp(`${attrName}=["']${attrValue}["']`, "i").test(html);
    }

    return html.includes(trimmed);
  }

  private findMissingSelectors(html: string, interactions: Array<{ selector?: string }>) {
    const uniqueSelectors = [...new Set(interactions.map((item) => item.selector || "").filter(Boolean))];
    return uniqueSelectors.filter((selector) => !this.selectorExistsInHtml(html, selector));
  }

  private async repairHtmlForSelectors(
    html: string,
    interactions: any[],
    missingSelectors: string[],
    aspectRatio: "16:9" | "9:16"
  ) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a senior frontend engineer. Repair HTML so all required selectors exist exactly. Preserve visual quality and existing behavior. Return only raw HTML.",
        },
        {
          role: "user",
          content: `Aspect ratio: ${aspectRatio}\nMissing selectors: ${JSON.stringify(
            missingSelectors
          )}\nInteractions: ${JSON.stringify(interactions)}\n\nCurrent HTML:\n${html}`,
        },
      ],
    });

    const fixed = (response.choices[0].message.content || "").replace(/```html|```/g, "").trim();
    return fixed || html;
  }

  async generateUICode(scriptContext: any) {
    const interactions = Array.isArray(scriptContext?.interactions) ? scriptContext.interactions : [];
    const aspectRatio: "16:9" | "9:16" = scriptContext?.renderConfig?.aspectRatio === "9:16" ? "9:16" : "16:9";
    const targetFrame = aspectRatio === "9:16" ? "720x1280 vertical mobile frame" : "1280x720 cinematic desktop frame";

    const prompt = `You are an elite, world-class frontend design architect (Apple x Stripe x Linear).
Create a stunning single-file HTML/CSS/JS product demo UI using Tailwind via CDN.

REQUIREMENTS:
1) Build for frame: ${targetFrame}.
2) Include premium visual hierarchy, polished motion, and micro-interactions.
3) Every selector in interactions must exist EXACTLY in HTML.
4) UI should clearly support the scripted story beats and interaction timeline.
5) Return raw HTML only.

Interactions:
${JSON.stringify(interactions)}
`;

    return retryAsync(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      let html = response.choices[0].message.content || "";
      html = html.replace(/```html|```/g, "");

      const missingSelectors = this.findMissingSelectors(html, interactions);
      if (missingSelectors.length > 0) {
        html = await this.repairHtmlForSelectors(html, interactions, missingSelectors, aspectRatio);
      }

      return html.trim();
    });
  }
}
