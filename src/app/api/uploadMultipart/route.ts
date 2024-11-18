import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "Missing fileName or fileType" });
  }

  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      ContentType: fileType,
    });

    const response = await s3Client.send(command);

    res.status(200).json({
      uploadId: response.UploadId,
    });
  } catch (error) {
    console.error("Error initializing multipart upload:", error);
    res.status(500).json({ error: "Failed to initialize multipart upload" });
  }
}
