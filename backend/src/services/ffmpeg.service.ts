import ffmpeg from "fluent-ffmpeg";

export class FFmpegService {
  private runCommand(command: ffmpeg.FfmpegCommand, outputPath: string, timeoutMs: number = 180000): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          command.kill("SIGKILL");
        } catch {
          // no-op
        }
        reject(new Error(`FFmpeg command timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      command
        .on("end", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve();
        })
        .on("error", (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async overlayPiP(mainVideoPath: string, overlayVideoPath: string, outputPath: string): Promise<void> {
    const command = ffmpeg(mainVideoPath)
      .input(overlayVideoPath)
      .complexFilter([
        "[1:v]scale=320:240[pip]",
        "[0:v][pip]overlay=W-w-20:H-h-20"
      ])
      .outputOptions([
        "-map 0:a?",
        "-c:v libx264",
        "-preset veryfast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-shortest"
      ]);

    return this.runCommand(command, outputPath);
  }

  async sideBySide(leftVideoPath: string, rightVideoPath: string, outputPath: string): Promise<void> {
    const command = ffmpeg(leftVideoPath)
      .input(rightVideoPath)
      .complexFilter([
        "[0:v]scale=640:720[left]",
        "[1:v]scale=640:720[right]",
        "[left][right]hstack"
      ])
      .outputOptions([
        "-map 0:a?",
        "-c:v libx264",
        "-preset veryfast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        "-shortest"
      ]);

    return this.runCommand(command, outputPath);
  }

  async mixAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    const command = ffmpeg(videoPath)
      .input(audioPath)
      .complexFilter([
        "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2"
      ])
      .outputOptions([
        "-c:v copy",
        "-shortest"
      ]);

    return this.runCommand(command, outputPath);
  }
}

export const ffmpegService = new FFmpegService();
