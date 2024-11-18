import { NextRequest, NextResponse } from 'next/server';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { fileKey } = await req.json();
    console.log("File Key:", fileKey);

    if (!fileKey) {
      console.error('No fileKey provided in request');
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
    }

    const s3Params = {
      Bucket: process.env.BUCKET_NAME!,
      Key: fileKey,
    };

    // Vérifier l'existence du fichier avec HeadObjectCommand
    try {
        await s3Client.send(new HeadObjectCommand(s3Params));
      
        // Si le fichier existe, générer l'URL de téléchargement
        const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand(s3Params), { expiresIn: 3600 });
        return NextResponse.json({ downloadUrl });
    } catch (err: any) { // On indique que `err` est de type `any`
        // Si le fichier n'existe pas encore, retourner une réponse indiquant cela
        if (err.name === 'NotFound') {
            return NextResponse.json({ processing: true }, { status: 202 }); // Statut 202 pour indiquer que le traitement est en cours
        }
        console.error('Erreur lors de la vérification de l\'existence du fichier:', err);
        return NextResponse.json({ error: 'Erreur lors de la vérification de l\'existence du fichier' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL de téléchargement:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération de l\'URL de téléchargement' }, { status: 500 });
  }
}
