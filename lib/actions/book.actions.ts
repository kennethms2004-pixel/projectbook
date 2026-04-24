"use server";

import { revalidatePath } from "next/cache";

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

async function findBookBySlug(slug: string, clerkId?: string) {
  const query: Record<string, string> = { slug };
  if (clerkId) query.clerkId = clerkId;

  const book = await Book.findOne(query).lean();

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

export async function getBookBySlug(
  slug: string,
  clerkId: string
): Promise<ActionResult<SerializedBook>> {
  try {
    const normalizedSlug = slug?.trim().toLowerCase();

    if (!normalizedSlug || !clerkId) {
      return {
        success: false,
        message: "Book slug is required.",
        error: "Book slug is required.",
      };
    }

    await connectToDatabase();

    const book = await findBookBySlug(normalizedSlug, clerkId);

    if (!book) {
      return {
        success: false,
        message: "Book not found.",
        error: "Book not found.",
      };
    }

    return {
      success: true,
      message: "Book fetched successfully.",
      data: book,
    };
  } catch (error) {
    logServerError("getBookBySlug", error);

    return {
      success: false,
      message: "Failed to fetch book.",
      error: "Failed to fetch book.",
    };
  }
}

export async function createBook(
  data: CreateBookInput
): Promise<ActionResult<{ book: SerializedBook }>> {
  const slug = generateSlug(data.title);

  if (!slug) {
    return {
      success: false,
      message: "Book title produced an invalid slug.",
      error: "Book title produced an invalid slug.",
    };
  }

  try {
    await connectToDatabase();

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

    revalidatePath("/");

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

    const payload = segments.map((segment, index) => {
      const trimmedContent = segment.content.trim();

      return {
        clerkId,
        bookId,
        segmentIndex: index,
        content: trimmedContent,
        pageNumber: segment.pageNumber,
        wordCount:
          segment.wordCount ??
          (trimmedContent ? trimmedContent.split(/\s+/).length : 0),
      };
    });

    const savedSegments = await BookSegment.insertMany(payload, { ordered: true });
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, clerkId },
      { totalSegments: savedSegments.length },
      { new: true }
    );

    if (!updatedBook) {
      throw new Error("Created book could not be updated with segment counts.");
    }

    revalidatePath("/");
    revalidatePath(`/books/${updatedBook.slug}`);

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

export type SegmentSearchHit = {
  segmentIndex: number;
  pageNumber?: number;
  content: string;
};

const SEARCH_RESULT_LIMIT = 3;
const REGEX_METACHARS = /[.*+?^${}()|[\]\\]/g;
const STOP_WORDS = new Set([
  "a", "an", "and", "the", "is", "are", "was", "were", "be", "to", "of",
  "in", "on", "at", "it", "this", "that", "these", "those", "for", "with",
  "as", "by", "or", "but", "if", "then", "so", "do", "does", "did",
  "about", "what", "which", "who", "whom", "how", "why", "when", "where",
]);

function extractKeywords(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export async function searchBookSegments(
  bookId: string,
  query: string
): Promise<SegmentSearchHit[]> {
  const trimmed = query?.trim();

  if (!bookId || !trimmed) {
    return [];
  }

  await connectToDatabase();

  try {
    const textResults = await BookSegment.find(
      { bookId, $text: { $search: trimmed } },
      {
        score: { $meta: "textScore" },
        content: 1,
        segmentIndex: 1,
        pageNumber: 1,
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(SEARCH_RESULT_LIMIT)
      .lean();

    if (textResults.length > 0) {
      return textResults.map((hit) => {
        const raw = hit as unknown as Record<string, unknown>;
        return {
          segmentIndex: Number(raw.segmentIndex ?? 0),
          pageNumber:
            typeof raw.pageNumber === "number"
              ? (raw.pageNumber as number)
              : undefined,
          content: String(raw.content ?? ""),
        };
      });
    }
  } catch (error) {
    logServerError("searchBookSegments:text", error);
  }

  const keywords = extractKeywords(trimmed);

  if (keywords.length === 0) {
    return [];
  }

  try {
    const escapedKeywords = keywords
      .slice(0, 5)
      .map((word) => word.replace(REGEX_METACHARS, "\\$&"));
    const pattern = escapedKeywords.join("|");
    const scoringRegex = new RegExp(pattern, "gi");

    const regexResults = await BookSegment.find({
      bookId,
      content: { $regex: pattern, $options: "i" },
    })
      .limit(50)
      .lean();

    return regexResults
      .map((hit) => {
        const raw = hit as unknown as Record<string, unknown>;
        const content = String(raw.content ?? "");
        const matches = content.match(scoringRegex);
        return {
          segmentIndex: Number(raw.segmentIndex ?? 0),
          pageNumber:
            typeof raw.pageNumber === "number"
              ? (raw.pageNumber as number)
              : undefined,
          content,
          score: matches ? matches.length : 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, SEARCH_RESULT_LIMIT)
      .map(({ segmentIndex, pageNumber, content }) => ({
        segmentIndex,
        pageNumber,
        content,
      }));
  } catch (error) {
    logServerError("searchBookSegments:regex", error);
    return [];
  }
}
