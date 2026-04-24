import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import Book from "@/database/models/book.model";
import { connectToDatabase } from "@/database/mongoose";
import { searchBookSegments } from "@/lib/actions/book.actions";

export const dynamic = "force-dynamic";

const SEARCH_TOOL_NAMES = new Set([
  "searchbook",
  "searchbooks",
  "search-book",
  "search-books",
  "search_book",
  "search_books",
]);
const NO_INFO_MESSAGE = "No information found about this topic.";
const EXCERPT_LENGTH = 900;

type ToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string | Record<string, unknown>;
  };
};

type VapiToolRequestBody = {
  message?: {
    toolCalls?: ToolCall[];
    toolCallList?: ToolCall[];
  };
  query?: string;
  bookId?: string;
};

type ToolArgs = {
  query?: string;
  bookId?: string;
};

function parseArguments(fn: ToolCall["function"]): ToolArgs {
  const args = fn?.arguments;
  if (!args) return {};
  if (typeof args === "string") {
    try {
      return JSON.parse(args) as ToolArgs;
    } catch {
      return {};
    }
  }
  return args as ToolArgs;
}

function isSearchToolCall(call: ToolCall) {
  const name = call.function?.name;
  return typeof name === "string" && SEARCH_TOOL_NAMES.has(name.toLowerCase());
}

function trimExcerpt(content: string) {
  const normalized = content.trim();
  if (normalized.length <= EXCERPT_LENGTH) return normalized;
  return `${normalized.slice(0, EXCERPT_LENGTH)}…`;
}

async function isRequestAuthorized(
  request: Request,
  bookClerkId: string
): Promise<boolean> {
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const headerSecret = request.headers.get("x-vapi-secret")?.trim();
    if (headerSecret && headerSecret === webhookSecret) {
      return true;
    }
  }

  try {
    const { userId } = await auth();
    if (userId && userId === bookClerkId) {
      return true;
    }
  } catch {
    // auth() can throw outside a request scope — fall through
  }

  return false;
}

async function runSearch(
  request: Request,
  bookId: string,
  query: string
): Promise<string> {
  if (!bookId || !query?.trim()) {
    return NO_INFO_MESSAGE;
  }

  await connectToDatabase();

  const book = await Book.findById(bookId).select("clerkId").lean<{
    clerkId: string;
  } | null>();

  if (!book) {
    return NO_INFO_MESSAGE;
  }

  const authorized = await isRequestAuthorized(request, book.clerkId);
  if (!authorized) {
    throw new Error("Unauthorized");
  }

  const hits = await searchBookSegments(bookId, query);
  if (!hits.length) {
    return NO_INFO_MESSAGE;
  }

  const excerpts = hits
    .map((hit) => trimExcerpt(hit.content))
    .filter((text) => text.length > 0);

  if (!excerpts.length) {
    return NO_INFO_MESSAGE;
  }

  return excerpts.join("\n\n");
}

export async function POST(request: Request) {
  let body: VapiToolRequestBody;
  try {
    body = (await request.json()) as VapiToolRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const toolCalls =
    body.message?.toolCalls ?? body.message?.toolCallList ?? [];

  if (toolCalls.length > 0) {
    const results = await Promise.all(
      toolCalls.map(async (call) => {
        const toolCallId = call.id ?? "";

        if (!isSearchToolCall(call)) {
          return {
            toolCallId,
            result: NO_INFO_MESSAGE,
          };
        }

        const { query, bookId } = parseArguments(call.function);

        if (!query || !bookId) {
          return {
            toolCallId,
            result: NO_INFO_MESSAGE,
          };
        }

        try {
          const result = await runSearch(request, bookId, query);
          return { toolCallId, result };
        } catch (error) {
          const message =
            error instanceof Error && error.message === "Unauthorized"
              ? "Unauthorized"
              : "Internal error";
          if (message !== "Unauthorized") {
            console.error("[vapi:search-book] tool call failed", error);
          }
          return {
            toolCallId,
            result: NO_INFO_MESSAGE,
          };
        }
      })
    );

    return NextResponse.json({ results });
  }

  const { query, bookId } = body;
  if (!query || !bookId) {
    return NextResponse.json(
      { error: "Missing required fields: query and bookId." },
      { status: 400 }
    );
  }

  try {
    const result = await runSearch(request, bookId, query);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[vapi:search-book] direct call failed", error);
    return NextResponse.json(
      { error: "Internal error while searching book." },
      { status: 500 }
    );
  }
}
