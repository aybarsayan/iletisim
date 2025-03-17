'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { UserData } from '@/types';

export default function KoleksiyonPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Doğrudan SVG veri URL'i kullan
    setUserData({
      name: "Misafir Kullanıcı",
      email: "misafir@ornek.com",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='50' font-weight='bold' text-anchor='middle' fill='white'%3EA%3C/text%3E%3C/svg%3E"
    });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
      <Navbar userData={userData} />
      <div className="container mx-auto p-6 pt-20">
        <h1 className="text-2xl font-bold mb-6">Koleksiyonum</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p>Koleksiyon görünümü geliştirme aşamasında.</p>
        </div>
      </div>
    </div>
  );
} 