import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BookConversation } from "@/components/book-conversation";
import { getBookBySlug } from "@/lib/actions/book.actions";

type BookPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: BookPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) {
    redirect("/");
  }

  const book = result.data;

  return (
    <main className="flex flex-1 bg-[#fdfcfb]">
      <Link href="/" aria-label="Back to library" className="back-btn-floating">
        <ArrowLeft className="size-5" aria-hidden />
      </Link>

      <BookConversation
        book={{
          _id: String(book._id),
          title: book.title,
          author: book.author,
          persona: book.persona,
          coverUrl: book.coverUrl,
        }}
      />
    </main>
  );
}
