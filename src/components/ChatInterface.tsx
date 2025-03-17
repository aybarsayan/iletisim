'use client';
import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronUp, MessageSquare, Maximize2, X } from 'lucide-react';
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
    question: "Türkiye'de devlet teşvikleri hakkında en çok yayılan yanlış bilgiler nelerdir?",
    category: 'general'
  },
  {
    id: 2,
    question: "Genç girişimcilere yönelik devlet destekleri hakkında yanlış bilinenler nelerdir?",
    category: 'general'
  },
  {
    id: 3,
    question: "Sosyal medyada ekonomi ve finans alanında en çok yayılan dezenformasyon örnekleri nelerdir?",
    category: 'technical'
  },
  {
    id: 4,
    question: "Deprem sonrası devlet yardımları hakkında ortaya çıkan yanıltıcı bilgiler nelerdir?",
    category: 'general'
  },
  {
    id: 5,
    question: "Seçim dönemlerinde kamu teşvikleri ile ilgili en sık yayılan dezenformasyonlar nelerdir?",
    category: 'gameplay'
  },
  {
    id: 6,
    question: "Devlet destekli projeler hakkında gençler arasında yayılan yanlış bilgiler nelerdir?",
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

function extractCitation(text: string) {
  if (!text.includes('】')) return false;
  const lastOpenBracket = text.lastIndexOf('【');
  if (lastOpenBracket === -1) return false;
  const potentialCitation = text.slice(lastOpenBracket);
  const closingBracketIndex = potentialCitation.indexOf('】');
  if (closingBracketIndex === -1) return false;
  const citationContent = potentialCitation.slice(0, closingBracketIndex + 1);
  const regex = /【\d+:\d+†(.+?)】/;
  const match = citationContent.match(regex);
  return match ? match[1] : false;
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


  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;


    
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
      let lastCitation = '';

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
                  
                  const newCitation = extractCitation(botMessageText);
                  if (newCitation !== false && newCitation !== lastCitation) {
                    lastCitation = newCitation;
                    // PDF indirme işlemini burada yapmıyoruz
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

        // Mesaj tamamlandıktan sonra, eğer citation varsa bir kez PDF indir
        if (lastCitation) {
          await handleDownload(lastCitation);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setThreadId(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownload = async (filename: string) => {
    if (isDownloading || !filename) return;

    try {
      setIsDownloading(true);
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error('İndirme hatası');
      }

      const { data } = await response.json();
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === 'bot') {
          return [...prev.slice(0, -1), {
            ...lastMessage,
            pdfUrl: data,
            showPdf: true
          }];
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    setShowPresetQuestions(false);
  };

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
                <div className="p-4 flex justify-end border-b">
                  <button
                    onClick={() => setFullscreenPdf(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
                    aria-label="PDF görüntüleyiciyi kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <iframe
                    src={`${fullscreenPdf}#toolbar=0&navpanes=0`}
                    className="absolute inset-0 w-full h-full"
                    title="PDF Görüntüleyici (Tam Ekran)"
                  />
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
                            
                            {/* Maximize Button */}
                            <button
                              onClick={() => message.pdfUrl ? setFullscreenPdf(message.pdfUrl) : null}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-105 z-10"
                              aria-label="PDF'i tam ekran görüntüle"
                            >
                              <Maximize2 className="w-4 h-4 text-gray-600" />
                            </button>

                            <iframe
                              src={`${message.pdfUrl}#toolbar=0&navpanes=0`}
                              className="w-full h-full"
                              title="PDF Görüntüleyici"
                              style={{
                                border: 'none',
                                borderRadius: '16px',
                              }}
                            />
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