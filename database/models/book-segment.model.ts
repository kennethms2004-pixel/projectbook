import mongoose, { Model, Schema } from "mongoose";

const BookSegmentSchema = new Schema<IBookSegment>(
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
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    segmentIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    pageNumber: {
      type: Number,
      index: true,
      sparse: true,
    },
    wordCount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });
BookSegmentSchema.index({ bookId: 1, pageNumber: 1 }, { sparse: true });
BookSegmentSchema.index({ content: "text" });

const BookSegment =
  (mongoose.models.BookSegment as Model<IBookSegment>) ||
  mongoose.model<IBookSegment>("BookSegment", BookSegmentSchema);

export default BookSegment;
