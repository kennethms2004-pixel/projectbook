import { UploadForm } from "@/components/upload-form";

export default function NewBookPage() {
  return (
    <main className="flex flex-1 bg-[#fdfcfb]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <section className="max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#241913] sm:text-[2.85rem]">
              Add a new book
            </h1>
            <p className="mt-3 text-base leading-7 text-[#6f6257] sm:text-lg">
              Upload a PDF to generate your interactive reading experience.
            </p>
          </section>

          <UploadForm />
        </div>
      </div>
    </main>
  );
}
