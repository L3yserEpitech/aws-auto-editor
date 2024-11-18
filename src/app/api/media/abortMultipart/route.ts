import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";

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

  const { uploadId, fileName } = req.body;

  if (!uploadId || !fileName) {
    return res.status(400).json({ error: "Missing uploadId or fileName" });
  }

  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: fileName,
      UploadId: uploadId,
    });

    await s3Client.send(command);

    res.status(200).json({ message: "Multipart upload aborted successfully" });
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
    res.status(500).json({ error: "Failed to abort multipart upload" });
  }
}
