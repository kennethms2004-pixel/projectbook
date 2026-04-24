import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from "@/lib/constants";

type UploadAssetType = "pdf" | "cover";

type UploadClientPayload = {
  clerkId: string;
  assetType: UploadAssetType;
};

function parseClientPayload(clientPayload: string | null) {
  if (!clientPayload) {
    return null;
  }

  try {
    return JSON.parse(clientPayload) as UploadClientPayload;
  } catch {
    return null;
  }
}

function getAllowedContentTypes(assetType: UploadAssetType) {
  return assetType === "pdf" ? ACCEPTED_PDF_TYPES : ACCEPTED_IMAGE_TYPES;
}

function getMaximumSize(assetType: UploadAssetType) {
  return assetType === "pdf" ? MAX_FILE_SIZE : MAX_IMAGE_SIZE;
}

export async function POST(request: Request): Promise<NextResponse> {
  const shouldHandleCallback =
    process.env.VERCEL === "1" || Boolean(process.env.VERCEL_BLOB_CALLBACK_URL);

  try {
    const body = (await request.json()) as HandleUploadBody;
    let authenticatedClerkId: string | null = null;

    if (body.type === "blob.generate-client-token") {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      authenticatedClerkId = userId;
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!authenticatedClerkId) {
          throw new Error("Unauthorized");
        }

        const payload = parseClientPayload(clientPayload);

        if (!payload || payload.clerkId !== authenticatedClerkId) {
          throw new Error("Invalid upload payload.");
        }

        return {
          allowedContentTypes: getAllowedContentTypes(payload.assetType),
          maximumSizeInBytes: getMaximumSize(payload.assetType),
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            clerkId: authenticatedClerkId,
            assetType: payload.assetType,
          }),
          callbackUrl: process.env.VERCEL_BLOB_CALLBACK_URL
            ? `${process.env.VERCEL_BLOB_CALLBACK_URL}/api/upload`
            : undefined,
        };
      },
      onUploadCompleted: shouldHandleCallback
        ? async ({ blob, tokenPayload }) => {
            console.log("Blob upload completed", {
              pathname: blob.pathname,
              tokenPayload,
            });
          }
        : undefined,
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to handle upload.";
    const status = message === "Unauthorized" ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
