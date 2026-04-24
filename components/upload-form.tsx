"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  checkBookExists,
  createBook,
  saveBookSegments,
} from "@/lib/actions/book.actions";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
} from "@/lib/constants";
import { parsePdf } from "@/lib/pdf";
import { generateSlug } from "@/lib/utils";
import {
  uploadFormDefaults,
  uploadFormSchema,
  type UploadFormInput,
  type UploadFormValues,
  type PersonaOptionKey,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/file-upload-field";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VoiceSelector } from "@/components/voice-selector";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type UploadAssetType = "pdf" | "cover";

function getBookUrl(slug: string) {
  return `/books/${encodeURIComponent(slug)}`;
}

function getFileExtension(file: File | Blob, fallbackExtension: string) {
  if ("name" in file && typeof file.name === "string" && file.name.includes(".")) {
    return file.name.slice(file.name.lastIndexOf("."));
  }

  if (file.type === "application/pdf") {
    return ".pdf";
  }

  if (file.type === "image/jpeg") {
    return ".jpg";
  }

  if (file.type === "image/webp") {
    return ".webp";
  }

  if (file.type === "image/png") {
    return ".png";
  }

  return fallbackExtension;
}

async function uploadAsset({
  assetType,
  clerkId,
  file,
  pathname,
}: {
  assetType: UploadAssetType;
  clerkId: string;
  file: File | Blob;
  pathname: string;
}) {
  return upload(pathname, file, {
    access: "public",
    contentType: file.type || undefined,
    handleUploadUrl: "/api/upload",
    clientPayload: JSON.stringify({
      clerkId,
      assetType,
    }),
  });
}

export function UploadForm() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UploadFormInput, unknown, UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: uploadFormDefaults,
  });

  const handleSubmit = async (values: UploadFormValues) => {
    setIsSubmitting(true);

    try {
      if (!isLoaded || !user) {
        toast.error("Sign in to upload and ingest a book.");
        return;
      }

      if (!values.pdfFile) {
        toast.error("Please choose a PDF file before submitting.");
        return;
      }

      const duplicateResult = await checkBookExists(values.title);

      if (!duplicateResult.success) {
        toast.error(duplicateResult.error ?? duplicateResult.message);
        return;
      }

      if (duplicateResult.data?.exists && duplicateResult.data.book) {
        toast.info(`"${values.title}" already exists. Redirecting to the saved book.`);
        form.reset(uploadFormDefaults);
        router.push(getBookUrl(duplicateResult.data.book.slug));
        return;
      }

      const parsedPdf = await parsePdf(values.pdfFile);

      if (!parsedPdf.fullText.trim() || parsedPdf.segments.length === 0) {
        toast.error("We couldn't extract readable text from that PDF.");
        return;
      }

      const slug = generateSlug(values.title);

      if (!slug) {
        toast.error("Please use a book title that can be converted into a valid slug.");
        return;
      }

      let pdfUpload;

      try {
        pdfUpload = await uploadAsset({
          assetType: "pdf",
          clerkId: user.id,
          file: values.pdfFile,
          pathname: `books/${user.id}/pdfs/${slug}${getFileExtension(values.pdfFile, ".pdf")}`,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload the PDF file."
        );
        return;
      }

      let coverUrl = "/assets/book-cover.svg";
      let coverBlobKey: string | undefined;

      if (values.coverImage) {
        try {
          const coverUpload = await uploadAsset({
            assetType: "cover",
            clerkId: user.id,
            file: values.coverImage,
            pathname: `books/${user.id}/covers/${slug}${getFileExtension(values.coverImage, ".png")}`,
          });

          coverUrl = coverUpload.url;
          coverBlobKey = coverUpload.pathname;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to upload the cover image."
          );
          return;
        }
      } else if (parsedPdf.coverImage) {
        try {
          const generatedCover = new File(
            [parsedPdf.coverImage],
            `${slug}-cover.png`,
            { type: parsedPdf.coverImage.type || "image/png" }
          );

          const coverUpload = await uploadAsset({
            assetType: "cover",
            clerkId: user.id,
            file: generatedCover,
            pathname: `books/${user.id}/covers/${slug}-cover.png`,
          });

          coverUrl = coverUpload.url;
          coverBlobKey = coverUpload.pathname;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to upload the generated cover."
          );
          return;
        }
      }

      const bookResult = await createBook({
        clerkId: user.id,
        title: values.title,
        author: values.author,
        persona: values.persona,
        fileUrl: pdfUpload.url,
        fileBlobKey: pdfUpload.pathname,
        fileSize: values.pdfFile.size,
        coverUrl,
        coverBlobKey,
      });

      if (!bookResult.success) {
        toast.error(bookResult.error ?? bookResult.message);
        return;
      }

      if (bookResult.alreadyExists && bookResult.data?.book) {
        toast.info(`"${values.title}" already exists. Redirecting to the saved book.`);
        form.reset(uploadFormDefaults);
        router.push(getBookUrl(bookResult.data.book.slug));
        return;
      }

      const createdBook = bookResult.data?.book;

      if (!createdBook) {
        toast.error("Book creation returned an incomplete response.");
        return;
      }

      const segmentResult = await saveBookSegments(
        createdBook._id,
        user.id,
        parsedPdf.segments
      );

      if (!segmentResult.success) {
        toast.error(segmentResult.error ?? segmentResult.message);
        return;
      }

      form.reset(uploadFormDefaults);
      toast.success(`"${createdBook.title}" is ready.`);
      router.push(getBookUrl(createdBook.slug));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative mt-10 rounded-[2rem]">
      {isSubmitting ? <LoadingOverlay /> : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8"
          noValidate
        >
          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-2xl font-semibold text-[#10213f]">
                  Book PDF File
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    accept={ACCEPTED_PDF_TYPES.join(",")}
                    buttonLabel="Click to upload PDF"
                    helperText="PDF file (max 50MB)"
                    icon={<Upload className="size-8" aria-hidden />}
                    value={field.value}
                    disabled={isSubmitting}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-2xl font-semibold text-[#10213f]">
                  Cover Image (Optional)
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    buttonLabel="Click to upload cover image"
                    helperText="Leave empty to auto-generate from PDF"
                    icon={<ImagePlus className="size-8" aria-hidden />}
                    value={field.value}
                    disabled={isSubmitting}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-2xl font-semibold text-[#10213f]">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Rich Dad Poor Dad"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-2xl font-semibold text-[#10213f]">
                    Author Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Robert Kiyosaki"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="persona"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-2xl font-semibold text-[#10213f]">
                  Choose Assistant Persona
                </FormLabel>
                <FormControl>
                  <VoiceSelector
                    disabled={isSubmitting}
                    value={field.value as PersonaOptionKey}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-[3.4rem] w-full rounded-2xl bg-[#1e40af] px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_32px_rgba(30,64,175,0.24)] hover:bg-[#1e3a8a]"
            >
              {isSubmitting ? "Creating experience..." : "Begin Synthesis"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
