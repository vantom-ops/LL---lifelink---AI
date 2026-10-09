import mongoose, { Schema, Document } from 'mongoose';
import { VoiceLanguage } from '../types';

export interface IPatient extends Document {
  fullName: string;
  preferredName?: string;
  dateOfBirth?: Date;
  age: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  profilePhotoUrl?: string;
  bloodGroup?: string;

  // Emergency & Caregivers
  emergencyContactName: string;
  emergencyContactPhone: string;
  relationship?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  secondaryRelationship?: string;
  createdCaregiverId: mongoose.Types.ObjectId;
  linkedUserId?: mongoose.Types.ObjectId;

  // Health / Body Condition Profile (Descriptive Only)
  mobilityStatus: 'Independent' | 'Walks with support' | 'Uses walking stick' | 'Uses walker' | 'Uses wheelchair' | 'Mostly bedbound';
  visionStatus: 'Normal vision' | 'Uses glasses' | 'Low vision';
  hearingStatus: 'Normal hearing' | 'Uses hearing aid' | 'Difficulty hearing';
  communicationPreference: string;
  knownAllergies: string[];
  importantHealthConditions: string[];
  dietaryRestrictions: string[];
  specialCareNotes?: string;
  medicalNotes?: string;

  // Preferences & Accessibility
  languagePreference: VoiceLanguage;
  voiceSpeed: number;
  fontSizePreference: 'normal' | 'large' | 'extra-large';
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    fullName: { type: String, required: true, trim: true },
    preferredName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    profilePhotoUrl: { type: String },
    bloodGroup: { type: String },

    // Emergency Contacts
    emergencyContactName: { type: String, required: true },
    emergencyContactPhone: { type: String, required: true },
    relationship: { type: String, default: 'Primary Caregiver' },
    secondaryContactName: { type: String },
    secondaryContactPhone: { type: String },
    secondaryRelationship: { type: String },
    createdCaregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    linkedUserId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },

    // Health / Body Condition Profile
    mobilityStatus: {
      type: String,
      enum: [
        'Independent',
        'Walks with support',
        'Uses walking stick',
        'Uses walker',
        'Uses wheelchair',
        'Mostly bedbound'
      ],
      default: 'Independent'
    },
    visionStatus: {
      type: String,
      enum: ['Normal vision', 'Uses glasses', 'Low vision'],
      default: 'Normal vision'
    },
    hearingStatus: {
      type: String,
      enum: ['Normal hearing', 'Uses hearing aid', 'Difficulty hearing'],
      default: 'Normal hearing'
    },
    communicationPreference: { type: String, default: 'Spoken / Friendly' },
    knownAllergies: { type: [String], default: [] },
    importantHealthConditions: { type: [String], default: [] },
    dietaryRestrictions: { type: [String], default: [] },
    specialCareNotes: { type: String },
    medicalNotes: { type: String },

    // Preferences
    languagePreference: { 
      type: String, 
      enum: ['English', 'Tamil', 'Tanglish', 'Hindi', 'Telugu'], 
      default: 'English' 
    },
    voiceSpeed: { type: Number, default: 0.9 },
    fontSizePreference: { 
      type: String, 
      enum: ['normal', 'large', 'extra-large'], 
      default: 'large' 
    },
    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true
  }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
