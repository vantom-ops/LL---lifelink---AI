import fs from 'fs';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { documentService } from '../services/document.service';
import { storageService } from '../services/storage.service';

export class DocumentController {
  public async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Medical file upload is required.' });
      }

      const userId = req.user!.userId;
      const { patientId, type, hospitalName, doctorName, documentDate, notes } = req.body;

      if (!patientId || !type) {
        return res.status(400).json({ success: false, message: 'patientId and type are required.' });
      }

      const stored = await storageService.saveBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const document = await documentService.uploadDocument(userId, {
        patientId,
        type,
        fileName: stored.fileName,
        fileUrl: stored.url,
        fileSizeBytes: stored.size,
        mimeType: stored.mimeType,
        hospitalName,
        doctorName,
        documentDate: documentDate ? new Date(documentDate) : new Date(),
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Medical document securely uploaded.',
        data: { document }
      });
    } catch (err) {
      next(err);
    }
  }

  public async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { patientId } = req.params;
      const { type, search, startDate, endDate } = req.query;

      const documents = await documentService.getDocuments(userId, patientId, {
        type: type as any,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({ success: true, data: { documents } });
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const document = await documentService.getDocumentById(userId, id);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }
      res.json({ success: true, data: { document } });
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const success = await documentService.deleteDocument(userId, id);
      res.json({ success, message: success ? 'Document deleted.' : 'Document not found.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Secure private file serving endpoint
   */
  public async serveFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { fileName } = req.params;
      const filePath = storageService.getFilePath(fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found on storage server.' });
      }

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
