import mongoose, { Document, Schema } from "mongoose"

export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  emailIsVerified: boolean
  otp?: string
  provider?: AuthProvider
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    emailIsVerified: { type: Boolean, default: false },
    otp: { type: String },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.EMAIL,
    },
  },
  { timestamps: true }
)

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema)