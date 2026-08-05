import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'cook' | 'user';
  status: 'active' | 'inactive';
  balance: number; // Available wallet balance
  location: 'none' | 'UK Guest' | 'UK Guest 2' | 'Kadana Guest';
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'cook', 'user'] },
    status: { type: String, required: true, enum: ['active', 'inactive'], default: 'active' },
    balance: { type: Number, required: true, default: 0 },
    location: { type: String, enum: ['none', 'UK Guest', 'UK Guest 2', 'Kadana Guest'], default: 'none' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times in development hot reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).User;
}
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
