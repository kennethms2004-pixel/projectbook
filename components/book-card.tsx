import Image from "next/image";
import Link from "next/link";

export function BookCard({ book }: BookCardProps) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group block rounded-2xl p-2 transition-transform duration-200 hover:-translate-y-1"
    >
      <div
        className="relative mx-auto aspect-[133/200] w-full max-w-[133px] overflow-hidden rounded-[1.05rem] border border-[#d9cfbf] shadow-[0_1px_0_rgba(255,255,255,0.9),0_16px_32px_rgba(79,63,43,0.08)] ring-1 ring-[#f4ede3] ring-inset transition-colors group-hover:border-[#c9baa5]"
        style={{ backgroundColor: book.coverColor }}
      >
        <Image
          src={book.coverURL}
          alt={`Cover of ${book.title} by ${book.author}`}
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 24vw, 133px"
          className="object-cover"
        />
      </div>

      <div className="mx-auto mt-4 w-full max-w-[133px]">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#2a211c] transition-colors group-hover:text-[#3d485e]">
          {book.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#7c6f63]">
          {book.author}
        </p>
      </div>
    </Link>
  );
}
