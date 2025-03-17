import { NextResponse } from 'next/server';

export async function GET() {
  // SVG placeholder URL'i oluştur
  const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='50' font-weight='bold' text-anchor='middle' fill='white'%3EA%3C/text%3E%3C/svg%3E`;
  
  // Kimlik doğrulama olmadan basit bir kullanıcı verisi döndür
  return NextResponse.json({
    name: "Misafir Kullanıcı",
    email: "misafir@ornek.com",
    image: placeholderSvg
  });
} 