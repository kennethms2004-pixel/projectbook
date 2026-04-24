import mongoose, { Model, Schema } from "mongoose";

const BookSchema = new Schema<IBook>(
  {
    clerkId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileBlobKey: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    persona: {
      type: String,
      trim: true,
    },
    coverUrl: {
      type: String,
      trim: true,
    },
    coverBlobKey: {
      type: String,
      trim: true,
    },
    totalSegments: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Book =
  (mongoose.models.Book as Model<IBook>) ||
  mongoose.model<IBook>("Book", BookSchema);

export default Book;
