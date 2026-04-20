import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type AuthPayload = {
  email: string;
  password: string;
  name?: string;
};

// --- AUTH ---
export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: AuthPayload) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.data.token, data.data.user);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: AuthPayload) => {
      const res = await api.post("/auth/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.data.token, data.data.user);
    },
  });
};

// --- PROJECTS ---
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get("/projects");
      return res.data.data;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await api.get(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ["PENDING", "GENERATING", "RENDERING", "RECORDING", "COMPOSING"].includes(status)) {
        return 3000;
      }
      return false;
    }
  });
};

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { inputText: string }) => {
      const res = await api.post("/projects", data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// --- GENERATION ---
export const useGenerateScript = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload:
        | string
        | {
            projectId: string;
            creative?: {
              platform?: "instagram_reels" | "tiktok" | "youtube_shorts";
              aspectRatio?: "9:16" | "16:9";
              tone?: "premium" | "bold" | "playful" | "crazy";
              durationSec?: number;
              audience?: string;
            };
          }
    ) => {
      const body = typeof payload === "string" ? { projectId: payload } : payload;
      const res = await api.post("/generate/script", body);
      return res.data.data;
    },
    onSuccess: (_, payload) => {
      const projectId = typeof payload === "string" ? payload : payload.projectId;
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
};

export const useGenerateUI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await api.post("/generate/ui", { projectId });
      return res.data.data;
    },
    onSuccess: (_, projectId) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
};

// --- RENDER & COMPOSE ---
export const useStartRender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await api.post("/render/start", { projectId });
      return res.data.data;
    },
    onSuccess: (_, projectId) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
};

export const useUploadMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("file", file);

      const res = await api.post("/media/upload/user-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
};

export const useComposeVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: string; layout?: string }) => {
      const res = await api.post("/compose/video", data);
      return res.data.data;
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
};
