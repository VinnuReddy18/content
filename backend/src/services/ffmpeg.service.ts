import ffmpeg from "fluent-ffmpeg";

export class FFmpegService {
  async overlayPiP(mainVideoPath: string, overlayVideoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(mainVideoPath)
        .input(overlayVideoPath)
        .complexFilter([
          "[1:v]scale=320:240[pip]",
          "[0:v][pip]overlay=W-w-20:H-h-20"
        ])
        .outputOptions("-c:a copy")
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });
  }

  async sideBySide(leftVideoPath: string, rightVideoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(leftVideoPath)
        .input(rightVideoPath)
        .complexFilter([
          "[0:v]scale=640:720[left]",
          "[1:v]scale=640:720[right]",
          "[left][right]hstack"
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });
  }

  async mixAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(audioPath)
        .complexFilter([
          "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2"
        ])
        .outputOptions("-c:v copy")
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });
  }
}

export const ffmpegService = new FFmpegService();
