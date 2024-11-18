import { NextRequest, NextResponse } from "next/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId, partNumber, fileName } = await req.json();

    if (!uploadId || !partNumber || !fileName) {
      return NextResponse.json({ error: "Missing uploadId, partNumber, or fileName" }, { status: 400 });
    }

    const command = new UploadPartCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
