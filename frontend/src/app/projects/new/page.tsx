"use client";

import { useCreateProject } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

const schema = z.object({
  inputText: z.string().min(5, "Please provide a more detailed idea."),
});

export default function NewProjectPage() {
  const router = useRouter();
  const createMutation = useCreateProject();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: (project: any) => {
        router.push(`/projects/${project.id}/script`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="mb-8 inline-flex items-center text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-2 text-3xl font-medium tracking-tight">What are we building today?</h1>
        <p className="mb-8 text-[#888888]">Describe your product idea, and we'll generate the UI and interaction script.</p>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Textarea 
                placeholder="e.g. A sleek task management tool highlighting dragging a card between columns..." 
                className="h-32 text-base"
                {...register("inputText")}
              />
              {errors.inputText && <p className="mt-2 text-xs text-red-500">{errors.inputText.message as string}</p>}
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={createMutation.isPending}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate Concept
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
