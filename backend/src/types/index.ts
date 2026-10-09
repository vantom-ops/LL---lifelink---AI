export type UserRole = 'caregiver' | 'senior' | 'admin';

export type MedicationEventStatus = 
  | 'UPCOMING'
  | 'DUE'
  | 'PENDING_CONFIRMATION'
  | 'TAKEN'
  | 'LATE'
  | 'MISSED'
  | 'NOT_TAKEN';

export type MedicalDocumentType = 
  | 'Prescription'
  | 'X-Ray'
  | 'CT Scan'
  | 'MRI'
  | 'ECG'
  | 'Ultrasound'
  | 'Blood Report'
  | 'Other Medical Report';

export type VoiceLanguage = 'English' | 'Tamil' | 'Tanglish' | 'Hindi' | 'Telugu';

export type NotificationType = 
  | 'MEDICATION_DUE'
  | 'PENDING_CONFIRMATION'
  | 'MEDICATION_TAKEN'
  | 'MEDICATION_MISSED'
  | 'MEDICATION_LATE'
  | 'SENIOR_REQUESTED_CONTACT'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'PUSH' | 'SMS' | 'IN_APP' | 'VOICE';

export interface ExtractedMedicationCandidate {
  medicineName: string;
  genericName?: string;
  dose: string;
  unit: string;
  form?: string;
  frequency: string;
  timing: string;
  foodInstruction: string;
  duration?: string;
  confidence: number;
}
