"use client";

import { useProject, useGenerateScript } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScriptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProject(id);
  const generateScript = useGenerateScript();
  
  const [editableScript, setEditableScript] = useState("");

  useEffect(() => {
    if (project?.script && !generateScript.isPending) {
      setEditableScript(JSON.stringify(project.script, null, 2));
    }
  }, [project?.script, generateScript.isPending]);

  const handleGenerate = () => {
    generateScript.mutate(id);
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
          <p className="mt-1 text-[#888888]">Review the generated flow for your video.</p>
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
              <div className="mb-4 text-sm font-medium text-[#888888]">JSON Payload (Editable in Future)</div>
              <Textarea 
                value={editableScript}
                onChange={(e) => setEditableScript(e.target.value)}
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
