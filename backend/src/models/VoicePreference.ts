import mongoose, { Schema, Document } from 'mongoose';
import { VoiceLanguage } from '../types';

export interface IVoicePreference extends Document {
  patientId: mongoose.Types.ObjectId;
  language: VoiceLanguage;
  voiceSpeed: number; // 0.5 to 1.5
  voicePitch: number; // 0.8 to 1.2
  customGreeting?: string;
  repeatPlayback: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VoicePreferenceSchema = new Schema<IVoicePreference>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, unique: true, index: true },
    language: {
      type: String,
      enum: ['English', 'Tamil', 'Tanglish', 'Hindi', 'Telugu'],
      default: 'English'
    },
    voiceSpeed: { type: Number, default: 0.9 },
    voicePitch: { type: Number, default: 1.0 },
    customGreeting: { type: String, default: 'Good morning' },
    repeatPlayback: { type: Boolean, default: true },
    isMuted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const VoicePreference = mongoose.model<IVoicePreference>(
  'VoicePreference',
  VoicePreferenceSchema
);
