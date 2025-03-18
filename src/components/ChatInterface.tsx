'use client';
import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronUp, MessageSquare, Maximize2, X, Download } from 'lucide-react';
import Image from 'next/image';
import Navbar from './Navbar';
import { UserData } from '@/types';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface MessageWithPdf extends Message {
  pdfUrl?: string;
  showPdf?: boolean;
}

// Önceden hazırlanmış sorular için interface
interface PresetQuestion {
  id: number;
  question: string;
  category: 'general' | 'gameplay' | 'technical';
  icon?: string;
}

const presetQuestions: PresetQuestion[] = [
  {
    id: 1,
    question: "CİMER'e en sık yapılan başvuru konuları nelerdir?",
    category: 'general'
  },
  {
    id: 2,
    question: "CİMER üzerinden yapılan başvurular nasıl değerlendirilir ve işleme alınır?",
    category: 'general'
  },
  {
    id: 3,
    question: "CİMER'e yapılan başvuruların kişisel veri güvenliği nasıl sağlanır?",
    category: 'technical'
  },
  {
    id: 4,
    question: "CİMER'e yapılan şikayetlerin çözüm süreci nasıl işler?",
    category: 'general'
  },
  {
    id: 5,
    question: "CİMER başvurularında en sık karşılaşılan yanlış başvuru türleri nelerdir?",
    category: 'gameplay'
  },
  {
    id: 6,
    question: "CİMER'e yapılan başvurular kamuda hangi politika değişikliklerine yol açmıştır?",
    category: 'technical'
  }
];



const Avatar = ({ src, alt, size = "normal" }: { src: string; alt: string; size?: "normal" | "small" }) => (
  <div className={`${size === "normal" ? "w-10 h-10" : "w-8 h-8"} rounded-full overflow-hidden relative ring-2 ring-primary-500 ring-offset-2 transition-transform duration-300 hover:scale-110`}>
    <Image
      src={src}
      alt={alt}
      fill
      sizes={`(max-width: ${size === "normal" ? "40px" : "32px"}) 100vw`}
      className="object-cover"
      priority
    />
  </div>
);


// Tüm citation'ları bul, sadece son citation'ı değil
function extractAllCitations(text: string) {
  const citations = [];
  const regex = /【\d+:\d+†(.+?)】/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    citations.push(match[1]);
  }
  
  return citations;
}

// Worker URL'ini statik olarak tanımla



const ChatInterface = () => {
  const [messages, setMessages] = useState<MessageWithPdf[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPresetQuestions, setShowPresetQuestions] = useState(false);
  const [fullscreenPdf, setFullscreenPdf] = useState<string | null>(null);
  const [pdfLoadErrors, setPdfLoadErrors] = useState<{[key: number]: boolean}>({});
  const [loadingPdfs, setLoadingPdfs] = useState<{[key: number]: boolean}>({});
  const [pdfBlobUrls, setPdfBlobUrls] = useState<{[key: number]: string}>({});
  const [directDownloadUrls, setDirectDownloadUrls] = useState<{[key: number]: string}>({});
  const [processedCitations, setProcessedCitations] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Doğrudan SVG veri URL'i kullan
    setUserData({
      name: "Misafir Kullanıcı",
      email: "misafir@ornek.com",
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='50' font-weight='bold' text-anchor='middle' fill='white'%3EA%3C/text%3E%3C/svg%3E"
    });
  }, []);

  // PDF verilerini base64'den blob'a dönüştürerek browser uyumluluğunu artırma
  const convertBase64ToBlob = async (base64Data: string, messageId: number) => {
    try {
      console.log("PDF Base64 verisini Blob'a dönüştürmeye başlanıyor");
      
      // Base64 veri URL'inden veri kısmını çıkar
      if (!base64Data.includes('base64,')) {
        console.error("Geçersiz base64 veri formatı");
        return null;
      }
      
      const base64Content = base64Data.split('base64,')[1];
      const contentType = base64Data.split(';')[0].split(':')[1] || 'application/pdf';
      
      // Base64'ü binary veriye dönüştür
      const binaryString = window.atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Binary veriyi Blob'a dönüştür
      const blob = new Blob([bytes], { type: contentType });
      
      // Blob URL oluştur
      const blobUrl = URL.createObjectURL(blob);
      console.log(`Blob URL oluşturuldu: ${blobUrl}`);
      
      // URL'i state'e kaydet
      setPdfBlobUrls(prev => ({...prev, [messageId]: blobUrl}));
      
      return blobUrl;
    } catch (error) {
      console.error("Base64 to Blob dönüşüm hatası:", error);
      return null;
    }
  };

  // Ana indirme işlemi başarısız olursa alternatif indirme methodunu dene
  const handleFallbackDownload = async (filename: string, messageId: number) => {
    try {
      console.log("Alternatif PDF indirme yöntemi deneniyor");
      
      const apiUrl = window.location.origin + '/api/download-redirect';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error(`Alternatif indirme başarısız: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.url) {
        throw new Error('İndirme URL\'i alınamadı');
      }
      
      console.log("Doğrudan S3 indirme URL'i alındı");
      
      // Doğrudan indirme URL'ini sakla
      setDirectDownloadUrls(prev => ({...prev, [messageId]: result.url}));
      
      // Kullanıcıya doğrudan indirme bağlantısı göster
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'bot') {
          return [...prev.slice(0, -1), {
            ...lastMessage,
            text: lastMessage.text + `\n\n[PDF doğrudan görüntülenemiyor. [PDF'i indirmek için tıklayın](${result.url})]`
          }];
        }
        return prev;
      });
      
      return result.url;
    } catch (error) {
      console.error("Alternatif indirme hatası:", error);
      return null;
    }
  };

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Yeni soru göndermeden önce citation listesini sıfırla
    setProcessedCitations([]);
    
    const userMessage: MessageWithPdf = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };

    setInputMessage('');
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('https://iletisim-backend.fly.dev/analiz/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(threadId && { 'X-Thread-Id': threadId })
        },
        body: JSON.stringify({ 
          prompt: inputMessage,
          threadId: threadId 
        })
      });

      const newThreadId = response.headers.get('X-Thread-Id');
      if (newThreadId) {
        setThreadId(newThreadId);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botMessageText = '';
      let lastCitations: string[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  botMessageText += data.content;
                  
                  // Tüm yeni citation'ları çıkar
                  const allCitations = extractAllCitations(botMessageText);
                  
                  // Henüz işlenmemiş yeni citation'ları bul
                  const newCitations = allCitations.filter(
                    citation => !processedCitations.includes(citation) && !lastCitations.includes(citation)
                  );
                  
                  // Yeni citation'ları işlenmiş olarak işaretle
                  if (newCitations.length > 0) {
                    lastCitations = [...lastCitations, ...newCitations];
                    console.log("Yeni alıntılar bulundu:", newCitations);
                  }

                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.sender === 'bot') {
                      return [...prev.slice(0, -1), {
                        ...lastMessage,
                        text: botMessageText
                      }];
                    } else {
                      return [...prev, {
                        id: Date.now(),
                        text: botMessageText,
                        sender: 'bot'
                      }];
                    }
                  });
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        // Yanıt tamamlandıktan sonra, bulunan tüm citation'lar için PDF indir
        if (lastCitations.length > 0) {
          console.log("Toplam indirme sayısı:", lastCitations.length);
          
          // Tamamlanmış citation'ları işlenmiş olarak işaretle
          setProcessedCitations(prev => [...prev, ...lastCitations]);
          
          // Her bir citation için PDF'i indir
          for (const citation of lastCitations) {
            await handleDownload(citation);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setThreadId(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownload = async (filename: string, retryCount = 0) => {
    // İşlenmiş citation kontrolü
    if (processedCitations.includes(filename) && retryCount === 0) {
      console.log(`Bu dosya daha önce işlendi, atlıyoruz: ${filename}`);
      return;
    }
    
    if (isDownloading && retryCount === 0) {
      console.log("Başka bir indirme işlemi devam ediyor, bekleyip tekrar deneyeceğiz");
      // İndirme işlemi devam ediyorsa, biraz bekleyip tekrar dene
      setTimeout(() => handleDownload(filename, 0), 2000); 
      return;
    }
    
    if (!filename) return;
    
    const MAX_RETRIES = 2;
    
    try {
      setIsDownloading(true);
      console.log(`PDF indirme başlatıldı: ${filename}, deneme: ${retryCount + 1}`);
      
      
      // Doğrudan API endpoint'in URL'ini kullan - Vercel için daha güvenilir
      const apiUrl = window.location.origin + '/api/download';
      console.log('API endpoint:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      // Detaylı HTTP yanıt bilgisi için
      console.log('HTTP Yanıt Durumu:', response.status, response.statusText);
      console.log('Response Headers:', Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('PDF indirme API hatası:', errorData);
        } catch (parseError) {
          console.error('API yanıtı JSON olarak ayrıştırılamadı:', parseError);
          console.error('Ham yanıt:', await response.text());
        }
        
        throw new Error(`İndirme hatası (${response.status}): ${errorData?.error || response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Başarılı yanıt JSON olarak ayrıştırılamadı:', parseError);
        const rawText = await response.text();
        console.log('Ham yanıt içeriği:', rawText.slice(0, 200));
        throw new Error('API yanıtı ayrıştırılamadı');
      }
      
      console.log('PDF indirme yanıtı:', { 
        success: result.success, 
        size: result.size, 
        contentType: result.contentType,
        filename: result.filename
      });
      
      if (!result.data) {
        console.error('PDF verisi alınamadı');
        throw new Error('PDF verisi alınamadı');
      }
      
      // PDF veri URL'ini doğrula
      if (!result.data.startsWith('data:') || !result.data.includes('base64')) {
        console.error('Geçersiz PDF veri URL formatı:', result.data.substring(0, 50) + '...');
        throw new Error('Geçersiz PDF veri formatı');
      }
      
      console.log('PDF veri URL\'i başarıyla alındı, boyut:', result.size || 'bilinmiyor');
      
      // Yeni mesaj oluşturmak yerine mevcut metne PDF ekle
      const messageId = Date.now();
      
      // Blob URL oluştur - daha iyi tarayıcı performansı için
      await convertBase64ToBlob(result.data, messageId);
      
      // Citation'ı işlenmiş olarak işaretle
      if (!processedCitations.includes(filename)) {
        setProcessedCitations(prev => [...prev, filename]);
      }
      
      // Son bot mesajını bul ve PDF ekle
      setMessages(prev => {
        // Bot mesajlarını filtrele ve en son mesajı al
        const botMessages = prev.filter(msg => msg.sender === 'bot');
        
        if (botMessages.length === 0) {
          console.error("Bot mesajı bulunamadı, PDF eklenemedi");
          return prev;
        }
        
        const lastBotMessageIndex = prev.findIndex(msg => msg.id === botMessages[botMessages.length - 1].id);
        
        if (lastBotMessageIndex === -1) {
          console.error("Bot mesajı dizide bulunamadı");
          return prev;
        }
        
        // Mevcut mesajdan bir kopya oluştur
        const updatedMessages = [...prev];
        
        // Yükleme durumunu ayarla
        setLoadingPdfs(loadingState => ({...loadingState, [messageId]: true}));
        
        // Yeni PDF bilgisini ekle
        const updatedBotMessage = {
          ...updatedMessages[lastBotMessageIndex],
          id: messageId, // ID'yi güncelle
          pdfUrl: result.data,
          showPdf: true
        };
        
        // Mesajları güncelle
        updatedMessages[lastBotMessageIndex] = updatedBotMessage;
        
        return updatedMessages;
      });
      
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      
      // Yeniden deneme mekanizması
      if (retryCount < MAX_RETRIES) {
        console.log(`Yeniden deneniyor (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => {
          handleDownload(filename, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Her denemede biraz daha uzun bekle
        return;
      }
      
      // Son deneme başarısız olduysa, alternatif indirme seçeneğini dene
      const messageId = Date.now();
      const directUrl = await handleFallbackDownload(filename, messageId);
      
      if (!directUrl) {
        // Alternatif yöntem de başarısız olduysa hata mesajı göster
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.sender === 'bot') {
            return [...prev.slice(0, -1), {
              ...lastMessage,
              text: lastMessage.text + `\n\n[PDF yüklenirken bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Lütfen tekrar deneyin.]`
            }];
          }
          return prev;
        });
      }
    } finally {
      // Son yeniden deneme değilse isDownloading'i false yapma
      if (retryCount >= MAX_RETRIES) {
        setIsDownloading(false);
      } else if (retryCount === 0) {
        setIsDownloading(false);
      }
    }
  };

  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    setShowPresetQuestions(false);
  };

  // PDF iframe yükleme durumunu izleme
  const handlePdfLoad = (messageId: number) => {
    console.log(`PDF ${messageId} yüklendi`);
    setLoadingPdfs(prev => ({...prev, [messageId]: false}));
    setPdfLoadErrors(prev => ({...prev, [messageId]: false}));
  };

  // PDF iframe yükleme hatası
  const handlePdfError = (messageId: number) => {
    console.error(`PDF ${messageId} yüklenemedi`);
    setLoadingPdfs(prev => ({...prev, [messageId]: false}));
    setPdfLoadErrors(prev => ({...prev, [messageId]: true}));
  };

  // PDF içeriğini görüntülemeden önce temizleme
  useEffect(() => {
    return () => {
      // Componentten çıkarken blob URL'leri temizle
      Object.values(pdfBlobUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [pdfBlobUrls]);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary-50 to-primary-100">
        <Navbar userData={userData} />

        {/* Fullscreen PDF Overlay */}
        <AnimatePresence>
          {fullscreenPdf && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            >
              <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 flex justify-between border-b">
                  <a 
                    href={fullscreenPdf} 
                    download={`document.pdf`}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm">PDF&apos;i İndir</span>
                  </a>
                  <button
                    onClick={() => setFullscreenPdf(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
                    aria-label="PDF görüntüleyiciyi kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <object
                    data={fullscreenPdf}
                    type="application/pdf"
                    className="absolute inset-0 w-full h-full"
                  >
                    <div className="flex items-center justify-center h-full">
                      <p>PDF görüntülenemiyor. <a href={fullscreenPdf} download className="text-primary-500 underline">İndirmek için tıklayın</a></p>
                    </div>
                  </object>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="space-y-6 mb-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'bot' && (
                      <div className="w-8">
                        <Avatar src="/levelLogo.png" alt="Bot Avatar" size="small" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4 max-w-[85%]">
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={`rounded-2xl p-4 ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                            : 'bg-white text-gray-800'
                        } shadow-lg hover:shadow-xl transition-all duration-300 group`}
                        style={{ 
                          maxWidth: message.pdfUrl ? '350px' : '100%',
                          width: message.pdfUrl ? '350px' : 'auto',
                          minHeight: message.pdfUrl ? '400px' : 'auto'
                        }}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      </motion.div>

                      {message.pdfUrl && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group"
                        >
                          <div className="w-[350px] h-[400px] rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
                            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Kontroller */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {/* İndir butonu */}
                              <a 
                                href={directDownloadUrls[message.id] || pdfBlobUrls[message.id] || message.pdfUrl} 
                                download={`document-${message.id}.pdf`}
                                target={directDownloadUrls[message.id] ? "_blank" : undefined}
                                className="p-1.5 rounded-lg bg-white/90 shadow-lg hover:bg-white hover:scale-105"
                                aria-label="PDF'i indir"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </a>
                              
                              {/* Tam ekran butonu */}
                              <button
                                onClick={() => message.pdfUrl ? setFullscreenPdf(pdfBlobUrls[message.id] || message.pdfUrl) : null}
                                className="p-1.5 rounded-lg bg-white/90 shadow-lg hover:bg-white hover:scale-105"
                                aria-label="PDF'i tam ekran görüntüle"
                              >
                                <Maximize2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            {/* PDF yükleme durumu göstergesi */}
                            {loadingPdfs[message.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                                <div className="flex flex-col items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Loader2 className="w-8 h-8 text-primary-500" />
                                  </motion.div>
                                  <p className="mt-2 text-sm text-gray-600">PDF yükleniyor...</p>
                                </div>
                              </div>
                            )}

                            {/* PDF yükleme hatası göstergesi */}
                            {pdfLoadErrors[message.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                                <div className="text-center p-4">
                                  <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-3">
                                    <X className="w-6 h-6 text-red-500" />
                                  </div>
                                  <p className="text-red-600 font-medium">PDF yüklenemedi</p>
                                  <p className="text-sm text-gray-600 mt-1">Dosya görüntülenirken bir hata oluştu.</p>
                                  <div className="flex gap-2 justify-center mt-3">
                                    <button 
                                      onClick={() => setPdfLoadErrors(prev => ({...prev, [message.id]: false}))}
                                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                                    >
                                      Tekrar Dene
                                    </button>
                                    <a 
                                      href={directDownloadUrls[message.id] || pdfBlobUrls[message.id] || message.pdfUrl} 
                                      download={`document-${message.id}.pdf`}
                                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                    >
                                      İndir
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Öncelikle Blob URL ile dene (daha iyi performans), yoksa data URL */}
                            <object
                              data={pdfBlobUrls[message.id] || message.pdfUrl}
                              type="application/pdf"
                              className="w-full h-full"
                              onLoad={() => handlePdfLoad(message.id)}
                              onError={() => handlePdfError(message.id)}
                            >
                              <div className="flex items-center justify-center h-full flex-col p-4 bg-gray-50">
                                <p className="text-sm text-gray-600 mb-2">PDF görüntülenemiyor.</p>
                                <a 
                                  href={pdfBlobUrls[message.id] || message.pdfUrl} 
                                  download={`document-${message.id}.pdf`}
                                  className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                                >
                                  PDF&apos;i İndir
                                </a>
                              </div>
                            </object>
                            
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-8">
                        <Avatar 
                          src={userData?.image || '/user-placeholder.png'} 
                          alt={`${userData?.name || 'Kullanıcı'} Avatar`}
                          size="small" 
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <Avatar src="/levelLogo.png" alt="Bot Avatar" size="small" />
                  <div className="bg-white rounded-2xl p-3 shadow-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4 text-primary-500" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Preset Questions Panel */}
            <AnimatePresence>
              {showPresetQuestions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-4 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Sık Sorulan Sorular</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {presetQuestions.map((q) => (
                        <motion.button
                          key={q.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePresetQuestionClick(q.question)}
                          className="p-3 text-left rounded-xl bg-primary-50 hover:bg-primary-100 text-sm text-gray-700 transition-all duration-200 flex items-center gap-2 group"
                        >
                          <MessageSquare className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
                          <span>{q.question}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input Form */}
            <div className="py-4">
              <motion.form 
                onSubmit={handleSendMessage}
                className="relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowPresetQuestions(!showPresetQuestions)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-xl bg-primary-50 text-primary-500 hover:bg-primary-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="Sık sorulan sorular"
                  >
                    <ChevronUp
                      className={`w-5 h-5 transition-transform duration-200 ${
                        showPresetQuestions ? 'rotate-180' : ''
                      }`}
                    />
                  </motion.button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      data-tour="chat-input"
                      value={inputMessage}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="w-full p-4 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 placeholder-gray-500 text-sm shadow-sm hover:border-primary-300"
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isLoading 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'bg-primary-500 hover:bg-primary-600'
                        } text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                        disabled={isLoading}
                        aria-label="Mesaj gönder"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Input Suggestions */}
                {inputMessage.trim() && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 bottom-full mb-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 space-y-1"
                  >
                    <p className="text-xs text-gray-500 px-2">Önerilen Sorular:</p>
                    {presetQuestions
                      .filter(q => q.question.toLowerCase().includes(inputMessage.toLowerCase()))
                      .slice(0, 3)
                      .map(q => (
                        <button
                          key={q.id}
                          onClick={() => handlePresetQuestionClick(q.question)}
                          className="w-full p-2 text-left text-sm text-gray-700 hover:bg-primary-50 rounded-lg transition-colors duration-150"
                        >
                          {q.question}
                        </button>
                      ))}
                  </motion.div>
                )}
              </motion.form>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatInterface;