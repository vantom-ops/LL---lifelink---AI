import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  preferredLanguage?: string;
  notificationPreference?: string;
  relationshipToSenior?: string;
  isActive: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      unique: true, 
      sparse: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    phone: { 
      type: String, 
      sparse: true, 
      trim: true,
      index: true 
    },
    passwordHash: { type: String },
    role: { 
      type: String, 
      enum: ['caregiver', 'senior', 'admin'], 
      default: 'caregiver',
      index: true 
    },
    avatarUrl: { type: String },
    address: { type: String },
    preferredLanguage: { type: String, default: 'English' },
    notificationPreference: { type: String, default: 'all' },
    relationshipToSenior: { type: String, default: 'Son' },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
