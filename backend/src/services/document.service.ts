import mongoose from 'mongoose';
import { MedicalDocument, IMedicalDocument } from '../models/MedicalDocument';
import { CaregiverPatientLink } from '../models/CaregiverPatientLink';
import { aiService } from './ai.service';
import { storageService } from './storage.service';
import { MedicalDocumentType } from '../types';

export class DocumentService {
  private async checkAccess(userId: string, patientId: string) {
    const link = await CaregiverPatientLink.findOne({
      caregiverId: new mongoose.Types.ObjectId(userId),
      patientId: new mongoose.Types.ObjectId(patientId),
      status: 'active'
    });
    if (!link) {
      // Check if the user is the senior themselves
      const Patient = mongoose.model('Patient');
      const patient = await Patient.findById(patientId);
      if (!patient || patient.linkedUserId?.toString() !== userId) {
        throw new Error('Access denied: You are not authorized to view or modify this patient’s documents.');
      }
    }
  }

  public async uploadDocument(
    uploadedBy: string,
    data: {
      patientId: string;
      type: MedicalDocumentType;
      fileName: string;
      fileUrl: string;
      fileSizeBytes?: number;
      mimeType?: string;
      hospitalName?: string;
      doctorName?: string;
      documentDate?: Date;
      notes?: string;
    }
  ): Promise<IMedicalDocument> {
    await this.checkAccess(uploadedBy, data.patientId);

    // Generate non-diagnostic, informational plain-language summary via AI service
    const aiSummary = await aiService.summarizeMedicalDocument(
      data.type,
      data.notes || `${data.type} document from ${data.hospitalName || 'hospital'}`,
      data.fileName
    );

    const doc = new MedicalDocument({
      patientId: new mongoose.Types.ObjectId(data.patientId),
      type: data.type,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSizeBytes: data.fileSizeBytes,
      mimeType: data.mimeType,
      hospitalName: data.hospitalName,
      doctorName: data.doctorName,
      documentDate: data.documentDate || new Date(),
      notes: data.notes,
      aiSummary: {
        summary: aiSummary.summary,
        keyObservations: aiSummary.keyObservations,
        isInformationalOnly: true,
        generatedAt: new Date()
      },
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy)
    });

    await doc.save();
    return doc;
  }

  public async getDocuments(
    userId: string,
    patientId: string,
    query?: {
      type?: MedicalDocumentType;
      search?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<IMedicalDocument[]> {
    await this.checkAccess(userId, patientId);

    const filter: any = { patientId: new mongoose.Types.ObjectId(patientId) };

    if (query?.type) {
      filter.type = query.type;
    }

    if (query?.search) {
      filter.$or = [
        { fileName: { $regex: query.search, $options: 'i' } },
        { hospitalName: { $regex: query.search, $options: 'i' } },
        { doctorName: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (query?.startDate || query?.endDate) {
      filter.documentDate = {};
      if (query.startDate) filter.documentDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.documentDate.$lte = new Date(query.endDate);
    }

    return MedicalDocument.find(filter).sort({ documentDate: -1, createdAt: -1 });
  }

  public async getDocumentById(userId: string, documentId: string): Promise<IMedicalDocument | null> {
    const doc = await MedicalDocument.findById(documentId);
    if (!doc) return null;

    await this.checkAccess(userId, doc.patientId.toString());
    return doc;
  }

  public async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const doc = await MedicalDocument.findById(documentId);
    if (!doc) return false;

    await this.checkAccess(userId, doc.patientId.toString());

    await storageService.deleteFile(doc.fileName);
    await MedicalDocument.findByIdAndDelete(documentId);
    return true;
  }
}

export const documentService = new DocumentService();
