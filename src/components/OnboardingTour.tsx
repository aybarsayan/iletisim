'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {  ChevronRight, X } from 'lucide-react';
import Cookies from 'js-cookie';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: 'body',
    title: "Level Asistan'a Hoş Geldiniz!",
    description: "Level dergisinin 1998'den 2021'e kadar olan sayılarını keşfetmeye hazır mısınız? Bu benzersiz deneyimde, dergi içeriklerini sohbet ederek açığa çıkaracak ve kendi koleksiyonunuzu oluşturacaksınız.",
    position: 'top'
  },
  {
    target: '[data-tour="chat-input"]',
    title: "Sohbete Başlayın",
    description: "Level Asistan'a dergilerle ilgili sorular sorarak içerikleri keşfedebilirsiniz. Her doğru içerik bulduğunuzda, ilgili dergi sayfaları koleksiyonunuza eklenecek!",
    position: 'top'
  },
  {
    target: '[data-tour="collection-button"]',
    title: "Koleksiyonunuzu Görüntüleyin",
    description: "Keşfettiğiniz tüm dergi sayfalarını burada görüntüleyebilirsiniz. Her dergi bir harita gibi, siz sordukça yeni bölümler açılacak!",
    position: 'left'
  },
  {
    target: '[data-tour="achievement"]',
    title: "Başarılarınızı Takip Edin",
    description: "Yeni bir içerik bulduğunuzda size bildirim gelecek ve ilgili sayfalar koleksiyonunuza eklenecek.",
    position: 'bottom'
  }
];

const OnboardingTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Cookie'yi kontrol et
    const hasCompletedTour = Cookies.get('hasCompletedTour');
    if (!hasCompletedTour) {
      setIsVisible(true);
    }
  }, []);

  const completeTour = () => {
    // 1 yıl geçerli cookie oluştur
    Cookies.set('hasCompletedTour', 'true', { expires: 365 });
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const getHighlightedElementPosition = () => {
    if (currentStep === 0) return null;

    const element = document.querySelector(tourSteps[currentStep].target);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const highlightPosition = getHighlightedElementPosition();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Karartılmış arka plan */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Hedeflenen element için highlight */}
          {highlightPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bg-white/10 border-2 border-primary-500 rounded-lg pointer-events-none"
              style={{
                left: highlightPosition.left,
                top: highlightPosition.top,
                width: highlightPosition.width,
                height: highlightPosition.height,
                transition: 'all 0.3s ease-in-out'
              }}
            />
          )}

          {/* Tour içeriği */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-[400px] bg-white rounded-xl shadow-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {currentTourStep.title}
              </h3>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              {currentTourStep.description}
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Turu Geç
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                {currentStep === tourSteps.length - 1 ? 'Başla' : 'İleri'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* İlerleme noktaları */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour; 