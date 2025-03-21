import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';

// Middleware bileşeni - CORS için header'ları ayarlar
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  // Hata durumlarında max 3 kez yeniden deneme
  maxAttempts: 3,
});

// S3 bağlantısının doğruluğunu kontrol et
const validateS3Credentials = () => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    console.error('AWS kimlik bilgileri eksik veya hatalı. Lütfen .env dosyanızı kontrol edin.');
    return false;
  }
  return true;
};

// Vercel ortamında OPTIONS requesti için yanıt veren fonksiyon
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  console.log("API download isteği alındı");
  
  // Vercel ortamında değişkenlerimizi kontrol edelim
  console.log("Ortam değişkenleri kontrol ediliyor (değerler gösterilmeden):");
  console.log("AWS_REGION mevcut mu:", !!process.env.AWS_REGION);
  console.log("AWS_ACCESS_KEY_ID mevcut mu:", !!process.env.AWS_ACCESS_KEY_ID);
  console.log("AWS_SECRET_ACCESS_KEY mevcut mu:", !!process.env.AWS_SECRET_ACCESS_KEY);
  console.log("AWS_BUCKET_NAME mevcut mu:", !!process.env.AWS_BUCKET_NAME);
  
  // S3 kimlik bilgilerini doğrula
  if (!validateS3Credentials()) {
    // Vercel üzerindeki sorunları belirlememiz için daha detaylı hata mesajı
    const missingCredentials = [];
    if (!process.env.AWS_ACCESS_KEY_ID) missingCredentials.push('AWS_ACCESS_KEY_ID');
    if (!process.env.AWS_SECRET_ACCESS_KEY) missingCredentials.push('AWS_SECRET_ACCESS_KEY');
    if (!process.env.AWS_REGION) missingCredentials.push('AWS_REGION');
    
    const errorMessage = `S3 yapılandırması eksik: ${missingCredentials.join(', ')}`;
    console.error(errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders() }
    );
  }

  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      console.error("Dosya adı sağlanmadı");
      return NextResponse.json({ error: 'Dosya adı gerekli' }, { status: 400, headers: corsHeaders() });
    }
    
    console.log(`İstenilen dosya: ${filename}`);
    const bucketName = process.env.AWS_BUCKET_NAME || 'leveldergi';
    const objectKey = `halkla/${filename}`;

    console.log(`S3 erişimi: Bucket=${bucketName}, Key=${objectKey}`);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    try {
      const response = await s3Client.send(command);
      
      if (!response) {
        console.error("S3 yanıt vermedi");
        throw new Error('S3 yanıtı alınamadı');
      }
      
      console.log("S3 yanıtı alındı:", response.ContentType, response.ContentLength);
      
      const stream = response.Body;

      if (!stream) {
        console.error("PDF stream alınamadı");
        throw new Error('PDF stream alınamadı');
      }

      // Stream'i buffer'a çevir
      const chunks = [];
      try {
        for await (const chunk of stream as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
      } catch (streamError) {
        console.error("Stream okuma hatası:", streamError);
        throw new Error(`Stream okuma hatası: ${streamError instanceof Error ? streamError.message : 'Bilinmeyen stream hatası'}`);
      }
      
      if (chunks.length === 0) {
        console.error("Dosya içeriği alınamadı");
        throw new Error('Dosya içeriği boş');
      }
      
      const buffer = Buffer.concat(chunks);
      console.log(`Buffer boyutu: ${buffer.length} byte`);
      
      if (buffer.length === 0) {
        console.error("Buffer boş");
        throw new Error('Dosya boyutu sıfır');
      }

      // Buffer'ı base64'e çevir
      const base64 = buffer.toString('base64');
      console.log(`Base64 boyutu: ${base64.length} karakter`);
      
      const contentType = response.ContentType || 'application/pdf';
      
      // Data URL'yi doğru formatta oluşturalım
      // Eğer browser PDF'i gösteremiyor ise, bu header'lar eksik olabilir
      // const dataUrl = `data:${contentType};base64,${base64}`;
      
      // Inline değerini ekleyerek gösterim için optimize edelim
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      console.log("PDF başarıyla base64'e dönüştürüldü ve gönderiliyor");
      console.log("Content Type:", contentType);
      
      // PDF meta verilerini daha iyi debugging için ekleyelim
      return NextResponse.json({ 
        data: dataUrl,
        size: buffer.length,
        contentType: contentType,
        filename: filename,
        success: true
      }, { headers: corsHeaders() });
    } catch (s3Error) {
      if (s3Error instanceof S3ServiceException) {
        console.error('S3 servis hatası:', s3Error.name, s3Error.message);
        return NextResponse.json(
          { error: `S3 hatası: ${s3Error.name} - ${s3Error.message}` },
          { status: 500, headers: corsHeaders() }
        );
      }
      throw s3Error;
    }
  } catch (error) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json(
      { error: `Dosya indirme hatası: ${errorMessage}` },
      { status: 500, headers: corsHeaders() }
    );
  }
} 