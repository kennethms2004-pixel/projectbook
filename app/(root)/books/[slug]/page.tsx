import { notFound } from "next/navigation";

import Book from "@/database/models/book.model";
import { connectToDatabase } from "@/database/mongoose";
import { voiceOptions } from "@/lib/constants";
import { serializeData } from "@/lib/utils";

type BookPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

type SerializedBookPageData = IBook & {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
};

async function getBookBySlug(slug: string) {
  await connectToDatabase();

  const book = await Book.findOne({ slug }).lean();

  return book
    ? (serializeData(book as unknown as SerializedBookPageData) as SerializedBookPageData)
    : null;
}

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: BookPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const book = await getBookBySlug(resolvedParams.slug);

  if (!book) {
    notFound();
  }

  const personaLabel =
    book.persona && book.persona in voiceOptions
      ? voiceOptions[book.persona as keyof typeof voiceOptions].name
      : book.persona || "Not set";

  return (
    <main className="flex flex-1 bg-[#fdfcfb]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 rounded-[2rem] border border-[#e7dccd] bg-white/90 p-6 shadow-[0_20px_50px_rgba(79,63,43,0.08)] sm:p-8 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[240px]">
            <div className="overflow-hidden rounded-[1.5rem] border border-[#dacdbc] bg-[#f8f1e7] shadow-[0_16px_36px_rgba(79,63,43,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.coverUrl || "/assets/book-cover.svg"}
                alt={`Cover of ${book.title}`}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a7e73]">
                Bookified Library
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#241913] sm:text-[2.9rem]">
                {book.title}
              </h1>
              <p className="text-lg leading-7 text-[#6f6257]">by {book.author}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#faf4ec] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7e73]">
                  Persona
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f241d]">
                  {personaLabel}
                </p>
              </div>

              <div className="rounded-2xl bg-[#faf4ec] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7e73]">
                  Segments
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f241d]">
                  {book.totalSegments}
                </p>
              </div>

              <div className="rounded-2xl bg-[#faf4ec] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7e73]">
                  Uploaded By
                </p>
                <p className="mt-2 break-all text-sm font-medium text-[#2f241d]">
                  {book.clerkId}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ede2d4] bg-[#fffaf4] p-5">
              <p className="text-sm leading-7 text-[#5f5247]">
                This book has been ingested and stored with its PDF, cover asset, and
                text segments. The next backend slices can now build search, playback,
                and conversation on top of this saved record.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
