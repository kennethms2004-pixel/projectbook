import Image from "next/image";
import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { buttonVariants } from "@/components/ui/button";
import { getAllBooks } from "@/lib/actions/book.actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FALLBACK_COVER = "/assets/book-cover.svg";
const DEFAULT_COVER_COLOR = "#f8f4e9";

const steps = [
  {
    number: "1",
    title: "Upload PDF",
    description: "Add your book file",
  },
  {
    number: "2",
    title: "AI Processing",
    description: "We analyze the content",
  },
  {
    number: "3",
    title: "Voice Chat",
    description: "Discuss with AI",
  },
] as const;

export default async function Home() {
  const result = await getAllBooks();
  const realBooks = result.success ? result.data?.books ?? [] : [];

  const books: Book[] = realBooks.map((book) => ({
    _id: book._id,
    title: book.title,
    author: book.author,
    slug: book.slug,
    coverUrl: book.coverUrl || FALLBACK_COVER,
    coverColor: DEFAULT_COVER_COLOR,
  }));

  return (
    <main className="flex flex-1 bg-[#fdfcfb]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid w-full gap-8 rounded-[1.2rem] bg-[#f3e5bf] px-7 py-7 sm:px-8 sm:py-8 lg:mt-3 lg:grid-cols-[310px_minmax(250px,1fr)_170px] lg:items-center lg:gap-6 lg:px-7 lg:py-8 xl:grid-cols-[340px_minmax(270px,1fr)_190px] xl:px-8">
          <div className="max-w-[20rem]">
            <h1 className="font-serif text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.04em] text-[#241913] sm:text-[3rem] lg:text-[3.25rem]">
              Your Library
            </h1>

            <p className="mt-3 max-w-[18rem] text-[0.95rem] leading-6 text-[#78685d] sm:text-[0.98rem]">
              Convert your books into interactive AI conversations. Listen,
              learn, and discuss your favorite reads.
            </p>

            <Link
              href="/books/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-6 inline-flex h-auto rounded-xl border-[#e4d8c7] bg-white px-4 py-3 text-[0.98rem] font-semibold text-[#2a211c] shadow-[0_10px_24px_rgba(93,76,53,0.08)] no-underline transition-transform hover:bg-white hover:translate-y-[-1px]"
              )}
            >
              <span className="text-base leading-none">+</span>
              Add new book
            </Link>
          </div>

          <div className="flex justify-center lg:justify-center">
            <div className="w-full max-w-[15rem] sm:max-w-[17rem] lg:max-w-[16.5rem] xl:max-w-[18rem]">
              <Image
                src="/assets/hero-illustration.png"
                alt="A stack of books with a globe and reading accessories"
                width={491}
                height={352}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <aside className="w-full max-w-[18rem] justify-self-center rounded-[1rem] bg-white px-3.5 py-4 shadow-[0_12px_26px_rgba(107,84,56,0.1)] ring-1 ring-[#eadfce] lg:max-w-none">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={cn(
                    "flex items-start gap-2.5",
                    index < steps.length - 1 && "border-b border-[#f3ede4] pb-3"
                  )}
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#d8cec1] text-[0.78rem] font-semibold text-[#5a4b40]">
                    {step.number}
                  </span>

                  <div className="min-w-0">
                    <h2 className="text-[0.97rem] leading-5 font-semibold text-[#2e2620]">
                      {step.title}
                    </h2>
                    <p className="mt-0.5 text-[0.82rem] leading-5 text-[#7c6f63]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 pb-12 sm:pb-14">
          {books.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-5">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-[#e4d8c7] bg-white/60 px-6 py-12 text-center">
              <p className="text-[1.05rem] font-semibold text-[#2e2620]">
                No books yet.
              </p>
              <p className="mt-1 text-[0.92rem] text-[#7c6f63]">
                Upload your first PDF to start an AI conversation.
              </p>
              <Link
                href="/books/new"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-5 inline-flex h-auto rounded-xl border-[#e4d8c7] bg-white px-4 py-3 text-[0.95rem] font-semibold text-[#2a211c] no-underline hover:bg-white"
                )}
              >
                <span className="text-base leading-none">+</span>
                Add new book
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
