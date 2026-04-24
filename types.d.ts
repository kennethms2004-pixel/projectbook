import type { Types } from "mongoose";

declare global {
  type Book = {
    _id: string;
    title: string;
    author: string;
    slug: string;
    coverUrl: string;
    coverColor: string;
  };

  type BookCardProps = {
    book: Book;
  };

  interface IBook {
    clerkId: string;
    title: string;
    slug: string;
    author: string;
    fileUrl: string;
    fileBlobKey: string;
    fileSize: number;
    persona?: string;
    coverUrl?: string;
    coverBlobKey?: string;
    totalSegments: number;
    createdAt?: Date;
    updatedAt?: Date;
  }

  interface IBookSegment {
    clerkId: string;
    bookId: Types.ObjectId;
    content: string;
    segmentIndex: number;
    pageNumber?: number;
    wordCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }

  interface IVoiceSession {
    clerkId: string;
    bookId: Types.ObjectId;
    durationInSeconds: number;
    billingPeriodStart: Date;
    startedAt?: Date;
    endedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }
}

export {};
