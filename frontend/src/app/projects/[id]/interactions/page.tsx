"use client";

import { useProject } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight, MousePointer2, Keyboard, Clock } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function InteractionsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project } = useProject(id);

  const interactions = (project?.script as any)?.interactions || [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href={`/projects/${id}/ui`} className="mb-8 inline-flex items-center text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to UI
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Interaction Timeline</h1>
          <p className="mt-1 text-[#888888]">Review the simulated actions our engine will perform.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => router.push(`/projects/${id}/camera`)}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          {interactions.length === 0 ? (
            <div className="text-center py-12 text-[#888888]">
              No discrete interactions defined in the script JSON.
            </div>
          ) : (
            <div className="space-y-6 relative border-l border-[#222224] ml-4 pl-8 py-2">
              {interactions.map((act: any, idx: number) => (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)] border-2 border-black" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {act.type === "click" ? (
                          <MousePointer2 className="h-4 w-4 text-[#888888]" />
                        ) : (
                          <Keyboard className="h-4 w-4 text-[#888888]" />
                        )}
                        <span className="font-medium capitalize">{act.type} Event</span>
                      </div>
                      <p className="text-sm font-mono text-[#888888] bg-[#141415] rounded px-2 py-1 inline-block">
                        {act.selector}
                      </p>
                      {act.text && (
                        <p className="mt-2 text-sm">
                          Types: <span className="text-white">"{act.text}"</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center text-[#888888] text-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      Delay: {act.delay || 0}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
