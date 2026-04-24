"use client";

import * as React from "react";
import { ImagePlus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
} from "@/lib/constants";
import {
  uploadFormDefaults,
  uploadFormSchema,
  type UploadFormInput,
  type UploadFormValues,
  type VoiceOptionKey,
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

export function UploadForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const form = useForm<UploadFormInput, unknown, UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: uploadFormDefaults,
  });

  const handleSubmit = async (values: UploadFormValues) => {
    setSuccessMessage(null);
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1600));

    setIsSubmitting(false);
    setSuccessMessage(
      `Mock submission complete for "${values.title}". Backend upload wiring can plug in next.`
    );
    form.reset(uploadFormDefaults);
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
                <FormLabel className="text-2xl font-semibold text-[#332821]">
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
                <FormLabel className="text-2xl font-semibold text-[#332821]">
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
                  <FormLabel className="text-2xl font-semibold text-[#332821]">
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
                  <FormLabel className="text-2xl font-semibold text-[#332821]">
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
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-2xl font-semibold text-[#332821]">
                  Choose Assistant Voice
                </FormLabel>
                <FormControl>
                  <VoiceSelector
                    disabled={isSubmitting}
                    value={field.value as VoiceOptionKey}
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
              className="h-[3.4rem] w-full rounded-2xl bg-[#7a4323] px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_32px_rgba(122,67,35,0.24)] hover:bg-[#66371d]"
            >
              {isSubmitting ? "Creating experience..." : "Begin Synthesis"}
            </Button>

            {successMessage ? (
              <p className="text-sm leading-6 text-[#5c4a3d]" aria-live="polite">
                {successMessage}
              </p>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
}
