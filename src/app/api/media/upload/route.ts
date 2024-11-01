import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: NextRequest) {
  console.log("1");
  const fileType = 'video/mp4'; // Type de fichier par défaut
  const Key = `${randomUUID()}.mp4`; // Générer un nom de fichier unique

  const s3Params = {
    Bucket: process.env.BUCKET_NAME!,
    Key,
    ContentType: fileType, // Toujours utiliser 'video/mp4'
  };

  try {
    // Utiliser le presigner pour générer l'URL signée
    console.log("2");
    const uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand(s3Params), { expiresIn: 60 });

    // Retourner l'URL signée pour que le client puisse uploader
    return NextResponse.json({
      uploadUrl,
      Key,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la génération de l\'URL signée' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const Key = searchParams.get('key');

  console.log('Received delete request for key:', Key);

  if (!Key) {
    console.error('No key provided in request');
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const s3Params = {
    Bucket: process.env.BUCKET_NAME!,
    Key,
  };

  console.log('S3 delete params:', s3Params);

  try {
    const data = await s3Client.send(new DeleteObjectCommand(s3Params));
    console.log('Delete object response:', data);
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting object from S3:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression du fichier' }, { status: 500 });
  }
}
