'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, MessageSquarePlus, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { UserData } from '@/types';

interface NavbarProps {
  userData: UserData | null;
}

const Navbar = ({ userData }: NavbarProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    console.log('Çıkış yapma özelliği devre dışı');
    // Çıkış yapma işlemi olmadan sadece bildirim göster
  };

  const handleNewChat = () => {
    window.location.reload();
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ve Başlık */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                <Image 
                  src="/levelLogo.png" 
                  alt="İletişim Başkanlığı Logo" 
                  width={36} 
                  height={36} 
                  className="relative rounded-full transition-transform duration-300 group-hover:scale-110"
                  priority 
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-primary-600 text-transparent bg-clip-text">
                  İletişim Başkanlığı
                </span>
                <span className="text-xs text-gray-600">
                  Halka İlişkiler Yayınları Asistanı
                </span>
              </div>
            </div>
          </motion.div>

          {/* Desktop Menü */}
          <div className="hidden sm:flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Yeni sohbet başlat"
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span className="text-sm font-medium">Yeni Sohbet</span>
            </motion.button>

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="cursor-pointer group"
              >
                {userData?.image ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden relative ring-2 ring-primary-500 ring-offset-2 transition-all duration-300 group-hover:ring-primary-600">
                    <Image
                      src={userData.image}
                      alt={`${userData.name} profil fotoğrafı`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center ring-2 ring-primary-500 ring-offset-2 transition-all duration-300 group-hover:ring-primary-600">
                    <User className="text-white w-5 h-5" />
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-3 border border-gray-100"
                  >
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">
                        {userData?.name || 'Kullanıcı'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userData?.email}
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {/* Profil sayfasına yönlendirme */}}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors duration-200"
                      >
                        <User className="w-4 h-4" />
                        <span>Profil</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobil Menü */}
          <div className="sm:hidden flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewChat}
              className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Yeni sohbet başlat"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200"
              aria-label="Menüyü aç/kapat"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobil Menü Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-gray-100 bg-white shadow-lg"
          >
            <div className="px-4 py-3 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full p-3 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Çıkış Yap</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar; 