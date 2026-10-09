import mongoose, { Schema, Document } from 'mongoose';

export type ProfessionalVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface IVerificationDocument {
  title: string;
  docType: 'identity_proof' | 'nursing_certificate' | 'first_aid' | 'background_check';
  url: string;
  uploadedAt: Date;
}

export interface IProfessionalCaregiver extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  serviceArea: string;
  serviceRadiusKm: number;
  professionalRole: string; // e.g. 'Certified Nursing Assistant', 'Geriatric Care Aide'
  experienceYears: number;
  credentialsSummary: string;
  hospital: string;
  department: string;
  rating: number;
  reviewsCount: number;
  reviews: Array<{
    author: string;
    rating: number;
    comment: string;
    date: Date;
  }>;
  verificationStatus: ProfessionalVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationDocuments: IVerificationDocument[];
  isAvailable: boolean;
  activeJobsCount: number;
  fixedAssistanceFee: number;
  bankDetails?: {
    accountHolder: string;
    ifscCode: string;
    accountNumberMasked: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProfessionalCaregiverSchema = new Schema<IProfessionalCaregiver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [80.2707, 13.0827]
      }
    },
    serviceArea: { type: String, required: true, default: 'Chennai Metro' },
    serviceRadiusKm: { type: Number, default: 15 },
    professionalRole: { type: String, required: true, default: 'Certified Geriatric Care Aide' },
    experienceYears: { type: Number, default: 3 },
    credentialsSummary: { type: String, default: 'Certified in elderly care & medication assistance' },
    hospital: { type: String, default: 'Apollo Hospitals, Greams Road' },
    department: { type: String, default: 'Geriatric Nursing & Home Care' },
    rating: { type: Number, default: 4.9 },
    reviewsCount: { type: Number, default: 28 },
    reviews: [
      {
        author: { type: String, required: true },
        rating: { type: Number, default: 5 },
        comment: { type: String, required: true },
        date: { type: Date, default: Date.now }
      }
    ],
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true
    },
    verificationNotes: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationDocuments: [
      {
        title: { type: String, required: true },
        docType: {
          type: String,
          enum: ['identity_proof', 'nursing_certificate', 'first_aid', 'background_check'],
          required: true
        },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    isAvailable: { type: Boolean, default: true, index: true },
    activeJobsCount: { type: Number, default: 0 },
    fixedAssistanceFee: { type: Number, default: 350 },
    bankDetails: {
      accountHolder: { type: String },
      ifscCode: { type: String },
      accountNumberMasked: { type: String }
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for location queries
ProfessionalCaregiverSchema.index({ location: '2dsphere' });
ProfessionalCaregiverSchema.index({ verificationStatus: 1, isAvailable: 1 });

export const ProfessionalCaregiver = mongoose.model<IProfessionalCaregiver>(
  'ProfessionalCaregiver',
  ProfessionalCaregiverSchema
);
