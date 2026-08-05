import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHistoryLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  details: string;
  createdAt: Date;
}

const HistoryLogSchema: Schema<IHistoryLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const HistoryLog: Model<IHistoryLog> = mongoose.models.HistoryLog || mongoose.model<IHistoryLog>('HistoryLog', HistoryLogSchema);
export default HistoryLog;
