"use client";

import { useProject, useGenerateScript } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, ArrowRight, Wand2, Ratio, Clapperboard, Palette } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ScriptRenderConfig = {
  aspectRatio?: "16:9" | "9:16";
  platform?: "instagram_reels" | "tiktok" | "youtube_shorts";
};

type ScriptPayload = {
  renderConfig?: ScriptRenderConfig;
};

export default function ScriptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProject(id);
  const generateScript = useGenerateScript();
  
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [platform, setPlatform] = useState<"instagram_reels" | "tiktok" | "youtube_shorts">("youtube_shorts");
  const [tone, setTone] = useState<"premium" | "bold" | "playful" | "crazy">("crazy");

  const scriptPayload = useMemo(() => (project?.script as ScriptPayload | undefined) || undefined, [project?.script]);
  const scriptRenderConfig = scriptPayload?.renderConfig;
  const effectiveAspectRatio = scriptRenderConfig?.aspectRatio || aspectRatio;
  const effectivePlatform = scriptRenderConfig?.platform || platform;
  const scriptText = project?.script ? JSON.stringify(project.script, null, 2) : "";

  const handleGenerate = () => {
    generateScript.mutate({
      projectId: id,
      creative: {
        aspectRatio: effectiveAspectRatio,
        platform: effectivePlatform,
        tone,
      },
    });
  };

  const handleContinue = () => {
    // Save is implicit for now or just proceed
    router.push(`/projects/${id}/ui`);
  };

  if (isLoading) return <LoadingScript />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="mb-8 inline-flex items-center text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Script & Flow</h1>
          <p className="mt-1 text-[#888888]">Direct the story style, then generate a high-retention script.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleGenerate} isLoading={generateScript.isPending}>
            <Wand2 className="mr-2 h-4 w-4" /> Regenerate
          </Button>
          <Button onClick={handleContinue} disabled={!project?.script}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid gap-4 md:grid-cols-3"
      >
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#B8B8B8]">
            <Ratio className="h-4 w-4" /> Aspect Ratio
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={effectiveAspectRatio === "16:9" ? "solid" : "outline"}
              onClick={() => setAspectRatio("16:9")}
              className="w-full"
            >
              16:9
            </Button>
            <Button
              variant={effectiveAspectRatio === "9:16" ? "solid" : "outline"}
              onClick={() => setAspectRatio("9:16")}
              className="w-full"
            >
              9:16
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#B8B8B8]">
            <Clapperboard className="h-4 w-4" /> Platform
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button variant={effectivePlatform === "youtube_shorts" ? "solid" : "outline"} onClick={() => setPlatform("youtube_shorts")} className="w-full">
              YouTube Shorts
            </Button>
            <Button variant={effectivePlatform === "instagram_reels" ? "solid" : "outline"} onClick={() => setPlatform("instagram_reels")} className="w-full">
              Instagram Reels
            </Button>
            <Button variant={effectivePlatform === "tiktok" ? "solid" : "outline"} onClick={() => setPlatform("tiktok")} className="w-full">
              TikTok
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#B8B8B8]">
            <Palette className="h-4 w-4" /> Tone
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["premium", "bold", "playful", "crazy"] as const).map((item) => (
              <Button
                key={item}
                variant={tone === item ? "solid" : "outline"}
                onClick={() => setTone(item)}
                className="w-full capitalize"
              >
                {item}
              </Button>
            ))}
          </div>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {!project?.script && !generateScript.isPending ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
              <Wand2 className="mb-4 h-8 w-8 text-[#888888]" />
              <p className="mb-6 text-[#888888]">No script generated yet.</p>
              <Button onClick={handleGenerate}>Generate AI Script</Button>
            </Card>
          </motion.div>
        ) : generateScript.isPending ? (
          <LoadingScript key="loading" />
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="mb-4 text-sm font-medium text-[#888888]">Generated JSON Payload</div>
              <Textarea 
                value={scriptText}
                readOnly
                className="font-mono text-sm h-96 bg-[#000000]"
                spellCheck={false}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScript() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-4xl px-6 py-12">
      <Skeleton className="h-4 w-24 mb-8" />
      <div className="mb-8 flex justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-[20px] w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    </motion.div>
  );
}
