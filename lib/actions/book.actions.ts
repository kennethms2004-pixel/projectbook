"use server";

import BookSegment from "@/database/models/book-segment.model";
import Book from "@/database/models/book.model";
import { connectToDatabase } from "@/database/mongoose";
import { generateSlug, serializeData } from "@/lib/utils";

type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  alreadyExists?: boolean;
};

type SerializedBook = IBook & {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
};

type CreateBookInput = {
  clerkId: string;
  title: string;
  author: string;
  persona: string;
  fileUrl: string;
  fileBlobKey: string;
  fileSize: number;
  coverUrl?: string;
  coverBlobKey?: string;
};

type SegmentInput = {
  content: string;
  pageNumber?: number;
  wordCount?: number;
};

function logServerError(scope: string, error: unknown) {
  console.error(`[book.actions:${scope}]`, error);
}

async function findBookBySlug(slug: string) {
  const book = await Book.findOne({ slug }).lean();

  return book
    ? (serializeData(book as unknown as SerializedBook) as SerializedBook)
    : null;
}

export async function checkBookExists(
  title: string
): Promise<ActionResult<{ exists: boolean; book?: SerializedBook }>> {
  try {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return {
        success: false,
        message: "Book title is required.",
        error: "Book title is required.",
      };
    }

    await connectToDatabase();

    const slug = generateSlug(normalizedTitle);
    const book = slug ? await findBookBySlug(slug) : null;

    return {
      success: true,
      message: book ? "Book already exists." : "Book is available.",
      data: {
        exists: Boolean(book),
        book: book ?? undefined,
      },
    };
  } catch (error) {
    logServerError("checkBookExists", error);

    return {
      success: false,
      message: "Failed to check for an existing book.",
      error: "Failed to check for an existing book.",
    };
  }
}

export async function getAllBooks(): Promise<
  ActionResult<{ books: SerializedBook[] }>
> {
  try {
    await connectToDatabase();

    const books = await Book.find({}).sort({ createdAt: -1 }).lean();

    const serialized = books.map(
      (book) => serializeData(book as unknown as SerializedBook) as SerializedBook
    );

    return {
      success: true,
      message: "Books fetched successfully.",
      data: { books: serialized },
    };
  } catch (error) {
    logServerError("getAllBooks", error);

    return {
      success: false,
      message: "Failed to fetch books.",
      error: "Failed to fetch books.",
    };
  }
}

export async function createBook(
  data: CreateBookInput
): Promise<ActionResult<{ book: SerializedBook }>> {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    if (!slug) {
      return {
        success: false,
        message: "Book title produced an invalid slug.",
        error: "Book title produced an invalid slug.",
      };
    }

    const existingBook = await findBookBySlug(slug);

    if (existingBook) {
      return {
        success: true,
        message: "Book already exists.",
        data: {
          book: existingBook,
        },
        alreadyExists: true,
      };
    }

    const createdBook = await Book.create({
      ...data,
      slug,
      totalSegments: 0,
    });

    return {
      success: true,
      message: "Book created successfully.",
      data: {
        book: serializeData(
          createdBook.toObject() as unknown as SerializedBook
        ) as SerializedBook,
      },
    };
  } catch (error) {
    const isDuplicateKeyError =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000;

    if (isDuplicateKeyError) {
      const slug = generateSlug(data.title);
      const existingBook = slug ? await findBookBySlug(slug) : null;

      if (existingBook) {
        return {
          success: true,
          message: "Book already exists.",
          data: {
            book: existingBook,
          },
          alreadyExists: true,
        };
      }
    }

    logServerError("createBook", error);

    return {
      success: false,
      message: "Failed to create book.",
      error: "Failed to create book.",
    };
  }
}

export async function saveBookSegments(
  bookId: string,
  clerkId: string,
  segments: SegmentInput[]
): Promise<ActionResult<{ bookId: string; savedCount: number }>> {
  try {
    await connectToDatabase();

    if (!segments.length) {
      return {
        success: false,
        message: "No book segments were provided.",
        error: "No book segments were provided.",
      };
    }

    const payload = segments.map((segment, index) => ({
      clerkId,
      bookId,
      segmentIndex: index,
      content: segment.content.trim(),
      pageNumber: segment.pageNumber,
      wordCount: segment.wordCount ?? segment.content.trim().split(/\s+/).length,
    }));

    const savedSegments = await BookSegment.insertMany(payload, { ordered: true });
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, clerkId },
      { totalSegments: savedSegments.length },
      { new: true }
    );

    if (!updatedBook) {
      throw new Error("Created book could not be updated with segment counts.");
    }

    return {
      success: true,
      message: "Book segments saved successfully.",
      data: {
        bookId: updatedBook._id.toString(),
        savedCount: savedSegments.length,
      },
    };
  } catch (error) {
    await Promise.allSettled([
      BookSegment.deleteMany({ bookId, clerkId }),
      Book.deleteOne({ _id: bookId, clerkId }),
    ]);

    logServerError("saveBookSegments", error);

    return {
      success: false,
      message: "Failed to save book segments.",
      error: "Failed to save book segments.",
    };
  }
}
