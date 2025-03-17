'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AchievementProps {
  title: string;
  subtitle: string;
  isVisible: boolean;
  onClose: () => void;
}

const Achievement = ({ title, subtitle, isVisible, onClose }: AchievementProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Ses elementini oluştur
    audioRef.current = new Audio('/sound.mp3');
    audioRef.current.volume = 0.3; // Ses seviyesini ayarla

    return () => {
      // Component unmount olduğunda ses nesnesini temizle
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      hasPlayedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isVisible && !hasPlayedRef.current && audioRef.current) {
      // Sadece görünür olduğunda ve daha önce çalmadıysa çal
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .catch(error => console.log('Ses çalma hatası:', error));
      hasPlayedRef.current = true;
    }

    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
        // Notification kapandığında hasPlayed'i sıfırla
        hasPlayedRef.current = false;
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    router.push('/koleksiyon');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.3 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.5 }}
          onClick={handleClick}
          className="fixed top-6 right-6 z-50 cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={isExpanded ? "expanded" : "collapsed"}
            variants={{
              expanded: { width: "400px", height: "auto" },
              collapsed: { width: "300px", height: "auto" }
            }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="relative">
              {/* Parıltı efekti */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="absolute inset-0 bg-gradient-to-r from-amber-200/30 to-[#FFA302]/30 rounded-xl"
              />

              <div className="relative p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-[#FFA302] flex items-center justify-center"
                  >
                    <Trophy className="w-6 h-6 text-white" />
                  </motion.div>
                </div>

                <div className="flex-1">
                  <motion.h3
                    animate={{ color: ["#f59e0b", "#FFA302", "#f59e0b"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="font-bold text-lg bg-gradient-to-r from-amber-500 to-[#FFA302] text-transparent bg-clip-text"
                  >
                    {title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-gray-600 mt-1"
                  >
                    {subtitle}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-amber-600 mt-2 italic"
                  >
                    Koleksiyonlarınızı görüntülemek için tıklayın
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Achievement; 