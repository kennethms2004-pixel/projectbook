import mongoose, { Model, Schema } from "mongoose";

const VoiceSessionSchema = new Schema<IVoiceSession>(
  {
    clerkId: {
      type: String,
      required: true,
      trim: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    durationInSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

VoiceSessionSchema.index({ clerkId: 1, billingPeriodStart: 1 });

const VoiceSession =
  (mongoose.models.VoiceSession as Model<IVoiceSession>) ||
  mongoose.model<IVoiceSession>("VoiceSession", VoiceSessionSchema);

export default VoiceSession;
