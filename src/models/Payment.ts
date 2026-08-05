import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  month: string; // YYYY-MM
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  status: 'paid' | 'unpaid';
  notes?: string;
  createdAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    month: { type: String, required: true, trim: true }, // Format "YYYY-MM"
    date: { type: Date, required: true, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'paid', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Add index on userId and month for easy lookups
PaymentSchema.index({ userId: 1, month: 1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
