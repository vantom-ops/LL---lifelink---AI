import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

export interface StoredFile {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  filePath: string;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async saveBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<StoredFile> {
    const ext = path.extname(originalName) || '.bin';
    const uniqueName = `${uuidv4()}${ext}`;
    const targetPath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(targetPath, buffer);
    const stats = await fs.promises.stat(targetPath);

    return {
      fileName: uniqueName,
      originalName,
      mimeType,
      size: stats.size,
      url: `/api/documents/files/${uniqueName}`,
      filePath: targetPath
    };
  }

  public getFilePath(fileName: string): string {
    // Basic sanitization
    const sanitized = path.basename(fileName);
    return path.join(this.uploadDir, sanitized);
  }

  public async deleteFile(fileName: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[StorageService] Failed to delete file ${fileName}:`, err);
      return false;
    }
  }
}

export const storageService = new StorageService();
