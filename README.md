# Projectbook

Projectbook is a Next.js App Router app for browsing a small library UI and uploading a new book PDF to generate an interactive reading experience. The current UI includes a homepage hero, a sample books grid, and a client-side upload form mounted inside a server-rendered page shell.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Clerk authentication
- shadcn-style UI primitives
- React Hook Form + Zod for upload form validation

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful production commands:

```bash
npm run lint
npm run build
npm run start
```

## Environment Variables

Create a local env file:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_ASSISTANT_ID`

Optional Clerk redirect variables may also be needed depending on your auth setup:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

Example:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_example
CLERK_SECRET_KEY=sk_test_example
NEXT_PUBLIC_ASSISTANT_ID=assistant_example
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## App Structure

- Homepage entry: `app/(root)/page.tsx`
- Upload page shell: `app/(root)/books/new/page.tsx`
- Client upload form: `components/upload-form.tsx`
- Route compatibility redirect: `app/add/page.tsx`

## Usage

### Browse the library

1. Open `/`.
2. Review the hero section and sample book grid.
3. Click a book card to navigate to its book slug URL.

### Add a new book

1. Open `/books/new` or use the navbar `Add New` link.
2. Upload a PDF file.
3. Optionally upload a cover image.
4. Enter the book title and author name.
5. Choose an assistant voice.
6. Submit the form to ingest the book.

## Validation Notes

- PDF uploads are required and limited to 50MB.
- Cover images are optional and limited to JPG, PNG, or WebP under 10MB.
- Voice selection is validated against the configured voice list in `lib/constants.ts`.
- On submit, the PDF and cover image are uploaded to Vercel Blob, the PDF is parsed client-side into text segments, and the book record plus its segments are persisted to MongoDB via `createBook` and `saveBookSegments`.

## Deploy

Build the production bundle first:

```bash
npm run build
```

Then run the production server locally with:

```bash
npm run start
```

For hosted deployment, configure the same environment variables in your platform before deploying.

## Troubleshooting

- If the app fails on auth routes or protected pages, confirm the Clerk keys are set correctly.
- If the upload form reports a missing assistant ID, set `NEXT_PUBLIC_ASSISTANT_ID` in `.env.local`.
- If Open Library covers fail to render, verify the remote image config in `next.config.ts`.
- If form validation behaves unexpectedly, clear the selected file and re-upload it to re-run client validation cleanly.

## PR Verification Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Manually verify `/` renders the hero and books grid inside the shared container.
- Manually verify `/books/new` is protected by Clerk middleware.
- Manually verify PDF upload, optional cover upload, voice selection, and loading overlay behavior.
