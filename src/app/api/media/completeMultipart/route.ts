import { NextRequest, NextResponse } from "next/server";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { uploadId, fileName, parts } = await req.json();

    if (!uploadId || !fileName || !parts) {
      return NextResponse.json({ error: "Missing uploadId, fileName, or parts" }, { status: 400 });
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    await s3Client.send(command);

    return NextResponse.json({ message: "Upload completed successfully" });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json({ error: "Failed to complete multipart upload" }, { status: 500 });
  }
}
