"use client";

import { useProject, useComposeVideo } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Clapperboard, CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";

type ProjectMedia = {
  type: string;
};

export default function RenderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project } = useProject(id);
  const composeVideo = useComposeVideo();
  const composeTriggeredRef = useRef(false);

  const status = project?.status || "PENDING";
  const hasUserVideo = project?.media?.some((m: ProjectMedia) => m.type === "USER_VIDEO") || false;
  
  useEffect(() => {
    // If it's done rendering, trigger composition automatically if media is present, or just go to final
    if (status === "RECORDING" && !composeTriggeredRef.current) { // Backend sets RECORDING after render finishes
      composeTriggeredRef.current = true;
      if (hasUserVideo) {
        composeVideo.mutate({ projectId: id, layout: "pip" });
      } else {
        router.push(`/projects/${id}/final`);
      }
    }
    
    if (status === "COMPLETED") {
      router.push(`/projects/${id}/final`);
    }
  }, [status, hasUserVideo, composeVideo, id, router]);

  const stages = [
    { key: "RENDERING", label: "Simulating interactions & Recording Chrome UI..." },
    { key: "COMPOSING", label: "Composing Picture-in-Picture overlay & Audio..." },
    { key: "COMPLETED", label: "Finalizing asset..." }
  ];

  const getStageState = (stageKey: string) => {
    const order = ["PENDING", "GENERATING", "RENDERING", "RECORDING", "COMPOSING", "COMPLETED"];
    const currentIndex = order.indexOf(status);
    // Since backend jumps from RENDERING -> RECORDING (done render), we treat RECORDING as past RENDERING.

    if (stageKey === "RENDERING") {
      if (currentIndex > order.indexOf("RENDERING")) return "complete";
      if (currentIndex === order.indexOf("RENDERING")) return "active";
    }
    if (stageKey === "COMPOSING") {
      if (currentIndex > order.indexOf("COMPOSING")) return "complete";
      if (currentIndex === order.indexOf("COMPOSING")) return "active";
      if (currentIndex === order.indexOf("RECORDING")) {
        return hasUserVideo ? "active" : "complete";
      }
    }
    if (stageKey === "COMPLETED") {
      if (currentIndex === order.indexOf("COMPLETED")) return "complete";
    }
    return "pending";
  };

  return (
    <div className="mx-auto flex max-w-2xl min-h-[80vh] flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
        <Card className="p-10">
          <div className="mb-10 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="inline-block mb-4">
              <Clapperboard className="h-10 w-10 text-[#EDEDED]" />
            </motion.div>
            <h1 className="text-2xl font-medium tracking-tight">Synthesizing Reel</h1>
            <p className="mt-2 text-[#888888]">Our servers are hard at work. This usually takes a minute.</p>
          </div>

          <div className="space-y-6">
            {stages.map((stage, idx) => {
              const state = getStageState(stage.key);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141415] border border-[#222224]">
                    {state === "complete" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : state === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#EDEDED]" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-[#222224]" />
                    )}
                  </div>
                  <p className={state === "active" ? "text-[#EDEDED] font-medium" : "text-[#888888]"}>
                    {stage.label}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
