import { NextRequest, NextResponse } from "next/server";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing fileName or fileType" }, { status: 400 });
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      ContentType: fileType,
    });

    const response = await s3Client.send(command);

    return NextResponse.json({ uploadId: response.UploadId });
  } catch (error) {
    console.error("Error initializing multipart upload:", error);
    return NextResponse.json({ error: "Failed to initialize multipart upload" }, { status: 500 });
  }
}
