import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMonthlySummary extends Document {
  month: string; // YYYY-MM
  totalCollection: number;
  totalPoints: number;
  pointPrice: number;
  allocatedAmount: number;
  finalized: boolean;
  finalizedAt?: Date;
  finalizedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MonthlySummarySchema: Schema<IMonthlySummary> = new Schema(
  {
    month: { type: String, required: true, unique: true }, // Format "YYYY-MM"
    totalCollection: { type: Number, required: true, default: 0 },
    totalPoints: { type: Number, required: true, default: 0 },
    pointPrice: { type: Number, required: true, default: 0 },
    allocatedAmount: { type: Number, required: true, default: 0 },
    finalized: { type: Boolean, default: false },
    finalizedAt: { type: Date },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const MonthlySummary: Model<IMonthlySummary> = mongoose.models.MonthlySummary || mongoose.model<IMonthlySummary>('MonthlySummary', MonthlySummarySchema);
export default MonthlySummary;
