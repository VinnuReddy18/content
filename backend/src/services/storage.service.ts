import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { env } from "@/config/env";

export interface StorageProvider {
  upload(key: string, body: Buffer | NodeJS.ReadableStream, contentType: string): Promise<string>;
  downloadUrl(key: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir = path.join(process.cwd(), "storage");

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(key: string, body: Buffer | NodeJS.ReadableStream, contentType: string): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (Buffer.isBuffer(body)) {
      await fs.promises.writeFile(filePath, body);
    } else {
      const fileStream = fs.createWriteStream(filePath);
      await pipeline(body, fileStream);
    }

    return `${env.STORAGE_BASE_URL}/storage/${key}`;
  }

  async downloadUrl(key: string): Promise<string> {
    return `${env.STORAGE_BASE_URL}/storage/${key}`;
  }
}

// In a real app we would have an S3StorageProvider if selected in env.
export const storageService = new LocalStorageProvider();
