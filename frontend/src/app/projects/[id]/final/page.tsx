"use client";

import { useProject } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Download, Share, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function FinalVideoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: project } = useProject(id);

  const finalMedia = project?.media?.find((m: any) => m.type === "FINAL") || project?.media?.find((m: any) => m.type === "DEMO");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/dashboard" className="mb-8 inline-flex items-center text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Your Demo Reel</h1>
          <p className="mt-1 text-[#888888]">Synthesis complete. Ready for distribution.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push(`/projects/${id}/script`)}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Iteration
          </Button>
          <a href={finalMedia?.url} download>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </a>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border border-[#222224] bg-black p-0 shadow-2xl relative w-full aspect-video flex justify-center">
          {finalMedia ? (
            <video 
              src={finalMedia.url} 
              controls 
              className="h-full max-h-[70vh] w-auto shadow-xl"
              autoPlay
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#888888]">
              Video asset not found.
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
