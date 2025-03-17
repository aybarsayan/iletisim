import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'Dosya adı gerekli' }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: 'leveldergi',
      Key: `dezanformasyon/${filename}`,
    });

    const response = await s3Client.send(command);
    const stream = response.Body;

    if (!stream) {
      throw new Error('PDF stream alınamadı');
    }

    // Stream'i buffer'a çevir
    const chunks = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Buffer'ı base64'e çevir
    const base64 = buffer.toString('base64');

    return NextResponse.json({ 
      data: `data:application/pdf;base64,${base64}` 
    });
  } catch (error) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      { error: `Dosya indirme hatası: ${errorMessage}` },
      { status: 500 }
    );
  }
} 