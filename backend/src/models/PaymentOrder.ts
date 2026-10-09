import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PAYMENT_PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'PAYOUT_PENDING'
  | 'PAYOUT_COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface IPaymentOrder extends Document {
  requestId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  caregiverId: mongoose.Types.ObjectId;
  professionalId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  provider: 'razorpay' | 'provider_gateway';
  providerOrderId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  status: PaymentStatus;
  receiptNumber: string;
  paidAt?: Date;
  payoutAmount?: number;
  payoutStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    caregiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    professionalId: { type: Schema.Types.ObjectId, ref: 'ProfessionalCaregiver' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['razorpay', 'provider_gateway'], default: 'razorpay' },
    providerOrderId: { type: String, required: true, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: { type: String },
    status: {
      type: String,
      enum: [
        'NOT_REQUIRED',
        'PAYMENT_PENDING',
        'AUTHORIZED',
        'PAID',
        'PAYOUT_PENDING',
        'PAYOUT_COMPLETED',
        'FAILED',
        'REFUNDED',
        'DISPUTED'
      ],
      default: 'PAYMENT_PENDING',
      index: true
    },
    receiptNumber: { type: String, required: true, unique: true },
    paidAt: { type: Date },
    payoutAmount: { type: Number },
    payoutStatus: { type: String, default: 'PENDING' }
  },
  {
    timestamps: true
  }
);

export const PaymentOrder = mongoose.model<IPaymentOrder>('PaymentOrder', PaymentOrderSchema);
