"use client";

import { useProjects } from "@/hooks/queries";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { PlusIcon, LogOut, Layout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProjectMedia = {
  id: string;
  type: "DEMO" | "USER_VIDEO" | "VOICEOVER" | "FINAL";
  url: string;
  createdAt: string;
};

type DashboardProject = {
  id: string;
  status: string;
  createdAt: string;
  inputText: string;
  media?: ProjectMedia[];
};

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-[#888888]">Manage your synthetic demo reels</p>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Link href="/projects/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Layout className="mb-4 h-12 w-12 text-[#888888]" />
          <h2 className="text-xl font-medium mb-2">No projects yet</h2>
          <p className="mb-6 text-sm text-[#888888] max-w-md">
            Get started by creating your first AI-generated demo reel. Just describe your idea to begin.
          </p>
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </Card>
      ) : (
        <motion.div 
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {projects?.map((project: DashboardProject) => (
            <motion.div key={project.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              {(() => {
                const finalMedia = project.media?.find((item: ProjectMedia) => item.type === "FINAL");
                const demoMedia = project.media?.find((item: ProjectMedia) => item.type === "DEMO");
                const hasPlayableMedia = Boolean(finalMedia || demoMedia);
                const destination = hasPlayableMedia ? `/projects/${project.id}/final` : `/projects/${project.id}/script`;

                return (
                  <Link href={destination}>
                    <Card className="group h-full cursor-pointer p-6 transition-colors hover:border-[#888888]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-[#222224] px-2.5 py-0.5 text-xs font-medium text-[#EDEDED]">
                      {project.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-[#888888]">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed line-clamp-3">
                    {project.inputText || "Untitled project"}
                  </p>
                      <div className="mt-4 text-xs text-[#9ca3af]">
                        {hasPlayableMedia ? "View Reel" : "Continue Workflow"}
                      </div>
                    </Card>
                  </Link>
                );
              })()}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
