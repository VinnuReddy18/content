"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight, Video, Square, Play, Upload } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUploadMedia, useStartRender, useProject } from "@/hooks/queries";

export default function CameraPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project } = useProject(id);
  const uploadMedia = useUploadMedia();
  const startRender = useStartRender();

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded">("idle");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const startRecording = useCallback(() => {
    if (!stream) return;
    setRecordingState("recording");
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(mediaRecorderRef.current?.state ? recordedChunks : [], { type: 'video/webm' });
      // Hack to get the actual chunks we just recorded instead of state
    };
    
    // Better way to handle blobs
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      setRecordingState("recorded");
    };

    mediaRecorder.start();
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleUploadAndContinue = () => {
    if (!videoBlob) return;
    const file = new File([videoBlob], "user-cam.webm", { type: "video/webm" });
    uploadMedia.mutate({ projectId: id, file }, {
      onSuccess: () => {
        startRender.mutate(id, {
          onSuccess: () => {
            router.push(`/projects/${id}/render`);
          }
        });
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href={`/projects/${id}/ui`} className="mb-8 inline-flex items-center text-sm text-[#888888] hover:text-[#EDEDED] transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to UI
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Record Overlay</h1>
          <p className="mt-1 text-[#888888]">Optionally record your webcam to overlay on the demo.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => startRender.mutate(id, { onSuccess: () => router.push(`/projects/${id}/render`) })}>
            Skip Video
          </Button>
          <Button onClick={handleUploadAndContinue} disabled={recordingState !== "recorded" || uploadMedia.isPending} isLoading={uploadMedia.isPending || startRender.isPending}>
            Upload & Render <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex flex-col items-center justify-center p-6 border-[#222224] overflow-hidden relative min-h-[500px]">
        {recordingState === "idle" && !stream && (
          <div className="text-center">
            <Video className="mx-auto mb-4 h-12 w-12 text-[#888888]" />
            <p className="mb-6 text-[#888888]">Camera access is required to record.</p>
            <Button onClick={startCamera}>Enable Camera</Button>
          </div>
        )}

        {(recordingState === "idle" || recordingState === "recording") && stream && (
          <div className="w-full relative rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-auto aspect-video object-cover transform -scale-x-100" muted />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              {recordingState === "idle" ? (
                <button onClick={startRecording} className="h-14 w-14 rounded-full border-4 border-white/50 bg-red-500 hover:bg-red-600 transition-colors" />
              ) : (
                <button onClick={stopRecording} className="h-14 w-14 rounded-full border-4 border-white/50 bg-transparent flex items-center justify-center backdrop-blur-md">
                  <div className="h-4 w-4 bg-red-500 rounded-sm" />
                </button>
              )}
            </div>
          </div>
        )}

        {recordingState === "recorded" && videoUrl && (
          <div className="w-full relative rounded-xl overflow-hidden bg-black">
            <video src={videoUrl} controls className="w-full h-auto aspect-video object-cover" />
            <div className="absolute top-4 right-4">
              <Button variant="solid" onClick={() => {
                setRecordingState("idle");
                setVideoBlob(null);
                setVideoUrl(null);
              }}>
                Retake
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
