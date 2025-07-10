"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { motion } from "framer-motion";
import { Login } from "@/components/login";
import { PDFCategorySelector } from "@/components/pdf-category-selector";
import { PDF_CATEGORIES, PDFCategory, extractPdfText, convertPdfTextToMarkdown } from "@/utils/extractPdfText";

export default function Home() {
  const { sendMessage } = useActions();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PDFCategory | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [showCategorySelector, setShowCategorySelector] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Check login status on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem("hotel_logged_in") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("hotel_logged_in");
    setIsLoggedIn(false);
    setMessages([]);
    setInput("");
    setExtractedText("");
    setSelectedFile(null);
    setSelectedCategory(null);
  };

  const clearAllData = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setMessages([]);
    setInput("");
    setExtractedText("");
    setSelectedFile(null);
    setSelectedCategory(null);
    window.location.reload();
  };

  const suggestedActions = [
    { title: "Otel hizmetleri", subtitle: "nelerdir?", action: "Otel hizmetleri nelerdir?" },
    { title: "PDF analizi", subtitle: "nasıl yapılır?", action: "PDF analizi nasıl yapılır?" },
    { title: "Oda servisi", subtitle: "nasıl çalışır?", action: "Oda servisi nasıl çalışır?" },
    { title: "Rezervasyon", subtitle: "nasıl yapabilirim?", action: "Rezervasyon nasıl yapabilirim?" },
  ];

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Lütfen geçerli bir PDF dosyası seçin.");
      return;
    }

    setSelectedFile(file);
    setShowCategorySelector(true);
  };

  const handleCategorySelect = async (category: PDFCategory) => {
    setSelectedCategory(category);
    setShowCategorySelector(false);
    setIsUploading(true);

    try {
      if (selectedFile) {
        const text = await extractPdfText(selectedFile);
        setExtractedText(text);
        
        setMessages((messages) => [
          ...messages,
          <Message key={messages.length} role="user" content={`📄 PDF Yüklendi: ${selectedFile.name} (${category.name})`} />,
        ]);

        await new Promise(resolve => setTimeout(resolve, 500));
        
        let analysisMessage = '';
        
        if (text.includes('📝 ÇİKARILAN METİN İÇERİĞİ:')) {
          analysisMessage = `Harika! **${selectedFile.name}** dosyanızı başarıyla analiz ettim. 

**${category.name}** kategorisinde zengin bir içerik buldum. Size en uygun seçenekleri sunabilmem için aşağıdakilerden hangisini tercih edersiniz?

${getCategoryQuestions(category.id)}

Hemen size özel öneriler hazırlayabilirim! ✨`;
        } else {
          analysisMessage = `**${selectedFile.name}** dosyanız yüklendi. 

${category.name} kategorisinde size nasıl yardımcı olabilirim? Aradığınız özel bir hizmet var mı?

${getCategoryQuestions(category.id)}`;
        }

        const response: ReactNode = <Message key={Date.now()} role="assistant" content={analysisMessage} />;
        setMessages((messages) => [...messages, response]);
        
        setIsUploading(false);
        resetPdfState();
      }
    } catch (error) {
      console.error('PDF extraction error:', error);
      setIsUploading(false);
      alert('PDF metin çıkarma işleminde hata oluştu.');
      resetPdfState();
    }
  };

  const getCategoryQuestions = (categoryId: string) => {
    switch (categoryId) {
      case 'spa':
        return `• **Fiyat tercihiniz** nedir? (ekonomik, orta, premium)
• Hangi **hizmet türünü** arıyorsunuz? (masaj, yüz bakımı, vücut bakımı)
• **Süre** konusunda tercihiniz? (kısa molalar, uzun dinlenme)
• Özel bir **ihtiyacınız** var mı?`;
      case 'food':
        return `• **Hangi öğün** için menü arıyorsunuz?
• **Yemek veya içecek** tercihiniz nedir? (ana yemek, meze, tatlı, içecek)
• **Diyet** ihtiyaçlarınız var mı? (vejetaryen, vegan, glutensiz)
• **Fiyat aralığınız** nedir?`;
      case 'events':
        return `• **Ne zaman** katılmak istiyorsunuz? (bugün, bu hafta)
• **Kimlerle** geliyorsunuz? (tek, çift, aile, grup)
• **Hangi tür** etkinlik ilginizi çekiyor?
• **İç/dış mekan** tercihiniz var mı?`;
      default:
        return `• **Hangi bilgileri** arıyorsunuz? (fiyatlar, saatler, şartlar)
• **Acil** bir ihtiyacınız mı var?
• **Özel** bir durum söz konusu mu?
• Size nasıl **yardımcı** olabilirim?`;
    }
  };

  const resetPdfState = () => {
    setShowCategorySelector(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelPdf = () => {
    resetPdfState();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hidden PDF Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      {/* Welcome Section - Only show when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 max-w-2xl"
          >
            <h1 className="text-4xl font-light text-white mb-4">
              Merhaba!
            </h1>
            <p className="text-xl text-gray-400 font-light">
              Size bugün nasıl yardımcı olabilirim?
            </p>
          </motion.div>

          {/* Suggested Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto w-full"
          >
            {suggestedActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  setMessages((messages) => [
                    ...messages,
                    <Message
                      key={messages.length}
                      role="user"
                      content={action.action}
                    />,
                  ]);
                  const response: ReactNode = await sendMessage(action.action);
                  setMessages((messages) => [...messages, response]);
                }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-left hover:bg-gray-800 transition-colors"
              >
                <div className="text-white font-medium">{action.title}</div>
                <div className="text-gray-400 text-sm">{action.subtitle}</div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Chat Messages Container */}
      {messages.length > 0 && (
        <div className="flex-1 flex flex-col">
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6"
            style={{ 
              maxHeight: 'calc(100vh - 120px)',
              minHeight: '200px'
            }}
          >
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div key={index}>
                  {message}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* PDF Status - Fixed at bottom */}
      {selectedFile && selectedCategory && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto flex justify-center">
            <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              📄 {selectedFile.name} ({selectedCategory.name}) - Aktif
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="bg-black border-t border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-3">
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!input.trim()) return;

                setMessages((messages) => [
                  ...messages,
                  <Message key={messages.length} role="user" content={input} />,
                ]);
                
                const userInput = input;
                setInput("");

                // Enhanced prompt if we have PDF context
                let enhancedPrompt = userInput;
                
                if (extractedText && selectedCategory) {
                  const hasPdfContent = extractedText.includes('📝 ÇİKARILAN METİN İÇERİĞİ:');
                  
                  if (hasPdfContent) {
                    const markdownContent = convertPdfTextToMarkdown(
                      extractedText, 
                      selectedCategory.name, 
                      selectedFile?.name || 'document.pdf'
                    );
                    
                    enhancedPrompt = `KULLANICI MESAJI: "${userInput}"

KATEGORİ: ${selectedCategory.name}

PDF İÇERİĞİ: Markdown formatında yapılandırılmış

MARKDOWN VERİLERİ:
\`\`\`markdown
${markdownContent}
\`\`\`

GÖREV: Bu yapılandırılmış Markdown verilerini kullanarak kullanıcının "${userInput}" talebine uygun hizmetleri bul. analyzeServices tool'u ile kartlar halinde göster. Her hizmet için gerçek fiyat, süre ve açıklama bilgilerini Markdown'dan çıkar. Markdown'da **bold** formatında olan fiyat ve süreler özellikle dikkat et.`;
                  } else {
                    enhancedPrompt = `KULLANICI MESAJI: "${userInput}"

KATEGORİ: ${selectedCategory.name}

PDF VERİLERİ: Çıkarma başarısız, manuel yardım gerekli

GÖREV: Kullanıcıdan PDF içeriğini tarif etmesini iste veya ${selectedCategory.name} kategorisinde genel yardım sun.`;
                  }
                }

                const response: ReactNode = await sendMessage(enhancedPrompt);
                setMessages((messages) => [...messages, response]);
              }}
              className="flex items-center gap-3"
            >
              {/* PDF Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                title="PDF Yükle"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Message Input */}
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        const form = e.currentTarget.form;
                        if (form) {
                          const submitEvent = new Event('submit', { bubbles: true });
                          form.dispatchEvent(submitEvent);
                        }
                      }
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full bg-transparent text-white placeholder-gray-400 border-0 outline-none resize-none min-h-[24px] max-h-32 text-base font-['Inter',_'system-ui',_sans-serif] leading-relaxed"
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '24px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex-shrink-0 p-2 bg-white text-black rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Top Bar with Logout - Fixed position */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        <button
          onClick={clearAllData}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Tüm verileri temizle"
        >
          Reset
        </button>
        <button
          onClick={handleLogout}
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors border border-gray-600"
        >
          Çıkış Yap
        </button>
      </div>

      {/* PDF Category Selector Modal */}
      {showCategorySelector && selectedFile && (
        <PDFCategorySelector
          fileName={selectedFile.name}
          onCategorySelect={handleCategorySelect}
          onCancel={handleCancelPdf}
        />
      )}
    </div>
  );
}
