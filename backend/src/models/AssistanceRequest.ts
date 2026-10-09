import mongoose, { Schema, Document } from 'mongoose';

export type AssistanceStatus =
  | 'CREATED'
  | 'PRIMARY_CAREGIVER_ALERTED'
  | 'ALTERNATIVE_CONTACTS_ALERTED'
  | 'PROFESSIONAL_SEARCH'
  | 'PROFESSIONAL_ALERTED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'ASSISTANCE_STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export type CompletionMethod = 'ASSISTED_HANDOFF' | 'ASSISTED_OPENED' | 'DIRECT_SUPERVISION';

export interface IAssistanceOffer {
  _id?: mongoose.Types.ObjectId;
  caregiverId: mongoose.Types.ObjectId;
  caregiverName: string;
  caregiverPhone: string;
  hospital: string;
  department: string;
  experienceYears: number;
  rating: number;
  offeredFee: number;
  estimatedArrival?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  offeredAt: Date;
}

export interface IAssistanceRequest extends Document {
  patientId: mongoose.Types.ObjectId;
  medicationEventId?: mongoose.Types.ObjectId;
  primaryCaregiverId: mongoose.Types.ObjectId;
  currentEscalationStage: AssistanceStatus;
  status: AssistanceStatus;
  reason: string;
  medicineLocationNotes?: string;
  priority: 'HIGH' | 'NORMAL';
  offers: IAssistanceOffer[];
  acceptedBy?: {
    helperId: mongoose.Types.ObjectId;
    helperType: 'primary_caregiver' | 'trusted_contact' | 'professional_caregiver';
    helperName: string;
    helperPhone: string;
  };
  dueAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  completionMethod?: CompletionMethod;
  patientConfirmation: boolean;
  caregiverConfirmation: boolean;
  locationPermission: boolean;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  approximateArea?: string;
  paymentRequired: boolean;
  fee: number;
  paymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssistanceRequestSchema = new Schema<IAssistanceRequest>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    medicationEventId: { type: Schema.Types.ObjectId, ref: 'MedicationEvent', index: true },
    primaryCaregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentEscalationStage: {
      type: String,
      required: true,
      default: 'PRIMARY_CAREGIVER_ALERTED',
      index: true
    },
    status: {
      type: String,
      required: true,
      default: 'PRIMARY_CAREGIVER_ALERTED',
      index: true
    },
    reason: {
      type: String,
      required: true,
      default: 'Physical disability / difficulty handling scheduled medication'
    },
    medicineLocationNotes: {
      type: String,
      default: 'Bedside medicine organizer'
    },
    priority: { type: String, enum: ['HIGH', 'NORMAL'], default: 'HIGH' },
    offers: [
      {
        caregiverId: { type: Schema.Types.ObjectId, ref: 'ProfessionalCaregiver', required: true },
        caregiverName: { type: String, required: true },
        caregiverPhone: { type: String, required: true },
        hospital: { type: String, default: 'Apollo Hospitals, Greams Road' },
        department: { type: String, default: 'Geriatric Nursing & Home Care' },
        experienceYears: { type: Number, default: 3 },
        rating: { type: Number, default: 4.9 },
        offeredFee: { type: Number, required: true, default: 350 },
        estimatedArrival: { type: String, default: '15 mins' },
        notes: { type: String },
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
          default: 'PENDING'
        },
        offeredAt: { type: Date, default: Date.now }
      }
    ],
    acceptedBy: {
      helperId: { type: Schema.Types.ObjectId, ref: 'User' },
      helperType: {
        type: String,
        enum: ['primary_caregiver', 'trusted_contact', 'professional_caregiver']
      },
      helperName: { type: String },
      helperPhone: { type: String }
    },
    dueAt: { type: Date, required: true, default: Date.now },
    acceptedAt: { type: Date },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    completionMethod: {
      type: String,
      enum: ['ASSISTED_HANDOFF', 'ASSISTED_OPENED', 'DIRECT_SUPERVISION', 'HANDED_TO_PATIENT']
    },
    patientConfirmation: { type: Boolean, default: false },
    caregiverConfirmation: { type: Boolean, default: false },
    locationPermission: { type: Boolean, default: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [80.2707, 13.0827] // Chennai coordinates default
      }
    },
    approximateArea: { type: String, default: 'T. Nagar, Chennai' },
    paymentRequired: { type: Boolean, default: false },
    fee: { type: Number, default: 0 },
    paymentId: { type: String },
    notes: { type: String }
  },
  {
    timestamps: true
  }
);

// 2dsphere index for location-aware caregiver matching
AssistanceRequestSchema.index({ location: '2dsphere' });
AssistanceRequestSchema.index({ patientId: 1, status: 1 });

export const AssistanceRequest = mongoose.model<IAssistanceRequest>(
  'AssistanceRequest',
  AssistanceRequestSchema
);
