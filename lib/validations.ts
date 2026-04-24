import { z } from "zod";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  DEFAULT_VOICE,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  voiceOptions,
} from "@/lib/constants";

export type VoiceOptionKey = keyof typeof voiceOptions;

const isFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

const pdfFileSchema = z
  .custom<File | null>((value) => value === null || isFile(value), {
    message: "Please upload a valid PDF file.",
  })
  .refine((file): file is File => file !== null, {
    message: "Please upload a PDF file.",
  })
  .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), {
    message: "Only PDF files are supported.",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "PDF files must be 50MB or smaller.",
  });

const coverImageSchema = z
  .custom<File | null>((value) => value === null || isFile(value), {
    message: "Please choose a valid image file.",
  })
  .refine(
    (file) => file === null || ACCEPTED_IMAGE_TYPES.includes(file.type),
    {
      message: "Cover images must be JPG, PNG, or WebP.",
    }
  )
  .refine((file) => file === null || file.size <= MAX_IMAGE_SIZE, {
    message: "Cover images must be 10MB or smaller.",
  });

export const uploadFormSchema = z.object({
  pdfFile: pdfFileSchema,
  coverImage: coverImageSchema,
  title: z
    .string()
    .trim()
    .min(1, "Please enter a book title."),
  author: z
    .string()
    .trim()
    .min(1, "Please enter the author name."),
  voice: z
    .string()
    .refine((value): value is VoiceOptionKey => value in voiceOptions, {
      message: "Choose an assistant voice.",
    }),
});

export type UploadFormInput = z.input<typeof uploadFormSchema>;
export type UploadFormValues = z.output<typeof uploadFormSchema>;

export const uploadFormDefaults: UploadFormInput = {
  pdfFile: null,
  coverImage: null,
  title: "",
  author: "",
  voice: DEFAULT_VOICE as VoiceOptionKey,
};
