import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Middleware bileşeni - CORS için header'ları ayarlar
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// S3 bağlantı hatalarını önlemek için doğru yapılandırma
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Vercel ortamında OPTIONS requesti için yanıt veren fonksiyon
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// Doğrudan S3'ten indirme bağlantısı oluştur
export async function POST(request: Request) {
  console.log("API indirme yönlendirme isteği alındı");
  
  try {
    const { filename } = await request.json();

    if (!filename) {
      console.error("Dosya adı sağlanmadı");
      return NextResponse.json({ error: 'Dosya adı gerekli' }, { status: 400, headers: corsHeaders() });
    }
    
    console.log(`İstenilen dosya: ${filename}`);
    const bucketName = process.env.AWS_BUCKET_NAME || 'leveldergi';
    const objectKey = `halkla/${filename}`;

    // S3 nesnesi için komut oluştur
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    // İmzalı URL oluştur
    try {
      // 5 dakika geçerli imzalı URL oluştur
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      
      console.log("İmzalı URL oluşturuldu");
      
      return NextResponse.json({ 
        url: signedUrl,
        success: true
      }, { headers: corsHeaders() });
    } catch (error) {
      console.error('İmzalı URL oluşturma hatası:', error);
      return NextResponse.json(
        { error: `İmzalı URL oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` },
        { status: 500, headers: corsHeaders() }
      );
    }
  } catch (error) {
    console.error('İndirme hatası:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      { error: `Dosya indirme hatası: ${errorMessage}` },
      { status: 500, headers: corsHeaders() }
    );
  }
} 