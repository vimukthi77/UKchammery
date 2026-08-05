import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMealRequest extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  points: number; // Cached point total
  createdAt: Date;
}

const MealRequestSchema: Schema<IMealRequest> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format "YYYY-MM-DD"
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate points
MealRequestSchema.pre('save', function (this: any) {
  let pts = 0;
  if (this.breakfast) pts += 1;
  if (this.lunch) pts += 2;
  if (this.dinner) pts += 1;
  this.points = pts;
});

// Index to prevent duplicate meal requests for the same user on the same day
MealRequestSchema.index({ userId: 1, date: 1 }, { unique: true });
MealRequestSchema.index({ date: 1 });

if (mongoose.models && mongoose.models.MealRequest) {
  delete mongoose.models.MealRequest;
}
const MealRequest: Model<IMealRequest> = mongoose.models.MealRequest || mongoose.model<IMealRequest>('MealRequest', MealRequestSchema);
export default MealRequest;
