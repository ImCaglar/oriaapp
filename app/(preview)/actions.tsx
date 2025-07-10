import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { ServiceCards, ServiceItem } from "@/components/service-cards";
import { PDF_CATEGORIES } from "@/utils/extractPdfText";

export interface HotelInfo {
  name: string;
  roomService: { available: boolean; hours: string };
  spa: { available: boolean; hours: string };
  restaurant: { available: boolean; hours: string };
  activities: string[];
}

let hotelInfo: HotelInfo = {
  name: "Grand Hotel Assistant",
  roomService: { available: true, hours: "24/7" },
  spa: { available: true, hours: "08:00 - 22:00" },
  restaurant: { available: true, hours: "06:00 - 23:00" },
  activities: ["Havuz", "Fitness", "Spa", "Çocuk Kulübü", "Gece Kulübü"]
};

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");
  const aiState = getMutableAIState<typeof AI>();

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  // Check if this message contains PDF data
  const hasPdfData = message.includes('📝 ÇİKARILAN METİN İÇERİĞİ:') || message.includes('MARKDOWN VERİLERİ:');
  const hasCategory = message.includes('KATEGORİ:');
  
  // Debug logging
  console.log('🔍 AI Message Analysis:', {
    messageLength: message.length,
    hasPdfData,
    hasCategory,
    messagePreview: message.substring(0, 200) + '...'
  });

  // Get learned questions and instructions from AI state
  const currentState = aiState.get();
  const learnedQuestions = currentState.learnedQuestions || {
    spa: [],
    food: [],
    events: [],
    general: []
  };
  const instructions = currentState.instructions || {
    spa: [],
    food: [],
    events: [],
    general: []
  };

  let systemPrompt = `\
      - Sen öğrenmeye açık bir AI asistanısın ve admin tarafından eğitiliyorsun
      - Türkçe konuşuyorsun ve admin kullanıcıdan öğrenmeye çalışıyorsun
      - Mobil app'te müşterilerle nasıl etkileşim kuracağını öğreniyorsun
      - Admin sana hangi soruları sorman gerektiğini öğretiyor
      - Mevcut soru planını sunup, admin'den ek öneriler istiyorsun
      - "Bu sorular yeterli mi? Başka ne eklememiz gerekir?" tarzında yaklaş
      
      DAHA ÖNCE ÖĞRENDİĞİN SORULAR:
      SPA Kategorisi: ${learnedQuestions.spa.length > 0 ? learnedQuestions.spa.join(', ') : 'Henüz öğrenilen soru yok'}
      Yemek Kategorisi: ${learnedQuestions.food.length > 0 ? learnedQuestions.food.join(', ') : 'Henüz öğrenilen soru yok'}
      Etkinlik Kategorisi: ${learnedQuestions.events.length > 0 ? learnedQuestions.events.join(', ') : 'Henüz öğrenilen soru yok'}
      Genel Sorular: ${learnedQuestions.general.length > 0 ? learnedQuestions.general.join(', ') : 'Henüz öğrenilen soru yok'}
      
      DAHA ÖNCE ALINAN TALİMATLAR:
      SPA Kategorisi: ${instructions.spa.length > 0 ? instructions.spa.join(' | ') : 'Henüz talimat yok'}
      Yemek Kategorisi: ${instructions.food.length > 0 ? instructions.food.join(' | ') : 'Henüz talimat yok'}
      Etkinlik Kategorisi: ${instructions.events.length > 0 ? instructions.events.join(' | ') : 'Henüz talimat yok'}
      Genel Talimatlar: ${instructions.general.length > 0 ? instructions.general.join(' | ') : 'Henüz talimat yok'}
      
      ÖNEMLİ: 
      - Daha önce öğrendiğin soruları her zaman hatırla ve kullan
      - Daha önce alınan talimatları MUTLAKA uygula (yukarıdaki TALİMATLAR listesine bak)
      - Admin yeni bir soru önerdiğinde, learnNewQuestion tool'unu kullanarak öğren
      - "Şu soruyu da ekle" gibi ifadeler duyduğunda hemen öğren
      - Öğrendiklerini göstermek için showLearnedQuestions tool'unu kullan
      - Her kategori için hem varsayılan sorularını hem de öğrendiğin ek soruları sun
      - Admin'den özel talimat geldiğinde önce acceptInstruction tool'unu kullan
      - "Tamam, dikkate alırım" demesini göster, sonra o talimata göre kartları oluştur
      - Her cevabında alınan talimatları kontrol et ve uygula
    `;

  if (hasPdfData && hasCategory) {
    systemPrompt += `\
      - Kullanıcı PDF yükledi ve içerik Markdown formatında yapılandırıldı
      - SADECE PDF'deki gerçek verileri kullan, hiçbir şey uydurma
      - İLK ÖNCE sadece soru setini sun ve admin'den özel talimat bekle
      - HEMEN analyzeServices tool'unu KULLANMA
      - Admin'den özel talimat gelirse (örn: "şarap için ayrı kategori oluştur") önce "Tamam, dikkate alırım" de
      - Sonra o talimata göre analyzeServices tool'unu kullan
      - **bold** formatındaki fiyat ve süreleri özellikle dikkate al
      - Fiyatları şu formatlardan tespit et: **€123**, **123€**, **$123**, **123₺**
      - Süreleri şu formatlardan tespit et: **60 dakika**, **1 saat**, **90 dk**
      - Her kartın title, description, price, duration bilgilerini tamamen Markdown'dan al
      - Etkinlik kategorisinde date veya dateRange bilgisini de ekle (tarih, gün, zaman)
      - Markdown'da fiyat yoksa price alanını boş bırak, süre yoksa duration alanını boş bırak
      - Etkinlik kategorisinde tarih bilgisi yoksa date alanını boş bırak
      - Markdown'da olmayan bilgileri asla ekleme, varsayma veya tahmin etme
      - Hizmet açıklamalarını Markdown'daki gerçek metinlerden oluştur
      - Sayfa başlıklarını ve yapılandırılmış içeriği kullan
      
      ÖNEMLİ KATEGORI KURALLARI:
      - analyzeServices tool'unda category parametresini MUTLAKA doğru gönder:
        * "Yemek ve İçecek" PDF kategorisi → category: "yemek ve içecek" 
        * "SPA" PDF kategorisi → category: "spa"
        * "Etkinlik Programı" PDF kategorisi → category: "etkinlik"
      - category parametresi buton metnini belirler:
        * "yemek ve içecek" → "Sipariş Ver" butonu (DOĞRU)
        * "spa" → "Hemen Randevu Al" butonu
        * "etkinlik" → "Etkinliğe Katıl" butonu
      - UYARI: "Yemek ve İçecek" kategorisinde "yemek ve içecek" dışında string kullanma!
    `;
  } else if (hasCategory) {
    systemPrompt += `\
      - PDF içeriği mevcut değil, admin'den öğrenmek için PDF yüklemesini iste
      - "Mobil app'te müşterilere hangi soruları sormam gerektiğini öğrenmem için, lütfen kategori dokümanını yükler misiniz?" de
      - Öğrenme odağında, meraklı bir yaklaşım sergile
    `;
  } else {
    systemPrompt += `\
      - PDF içeriği olmadığında admin'den öğrenmek için PDF yüklemesini iste
      - "Nasıl daha iyi hizmet verebilirim?" tarzında öğrenme odağında sorular sor
      - showHotelInfo tool'unu sadece genel sistem bilgisi istenirse kullan
      - Her zaman "daha iyi öğrenmek" için admin'den yardım iste
    `;
  }

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    tools: {
      showHotelInfo: {
        description: "otel hakkında genel bilgi göster - saatler, hizmetler, aktiviteler",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "showHotelInfo",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showHotelInfo",
                  toolCallId,
                  result: `Otel bilgileri görüntüleniyor`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {hotelInfo.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Oda Servisi:</span>
                    <span className="text-green-600 dark:text-green-400">{hotelInfo.roomService.hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800 dark:text-blue-200">SPA:</span>
                    <span className="text-green-600 dark:text-green-400">{hotelInfo.spa.hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Restoran:</span>
                    <span className="text-green-600 dark:text-green-400">{hotelInfo.restaurant.hours}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Aktiviteler:</p>
                  <div className="flex flex-wrap gap-1">
                    {hotelInfo.activities.map((activity, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          } />;
        },
      },
      analyzeServices: {
        description: "PDF'den çıkarılan gerçek verileri kullanarak hizmetleri analiz et ve kartlar halinde göster. UYARI: category parametresini doğru gönder! 'Yemek ve İçecek' kategorisi için 'yemek ve içecek' kullan.",
        parameters: z.object({
          services: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            price: z.string().optional(),
            duration: z.string().optional(),
            category: z.string().describe("Hizmet kategorisi: MUTLAKA 'spa', 'yemek ve içecek', 'etkinlik' veya 'otel hizmetleri' olarak gönder"),
            date: z.string().optional().describe("Etkinlik kategorisi için tarih bilgisi"),
            dateRange: z.string().optional().describe("Etkinlik kategorisi için tarih aralığı bilgisi")
          })),
          category: z.string().describe("Ana kategori: 'SPA', 'Yemek ve İçecek', 'Etkinlik Programı', 'Otel Hizmetleri'"),
          source: z.string().optional().describe("PDF'den çıkarılan kaynak bilgi")
        }),
        generate: async function* ({ services, category, source }) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "analyzeServices",
                  args: { services, category, source },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "analyzeServices",
                  toolCallId,
                  result: `PDF'den ${services.length} gerçek hizmet analiz edildi ve ${category} kategorisinde gösterildi`,
                },
              ],
            },
          ]);

          const introMessage = source 
            ? `🎯 PDF'den çıkardığım ${category} hizmetleri:`
            : `📋 ${category} kategorisinde ${services.length} hizmet bulundu:`;

          return <Message role="assistant" content={
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {introMessage}
              </p>
              <ServiceCards services={services} category={category} />
              {source && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  * Fiyat ve bilgiler PDF dokümanından alınmıştır
                </p>
              )}
            </div>
          } />;
        },
      },
      learnNewQuestion: {
        description: "Admin'den yeni bir soru öğren ve hafızana kaydet",
        parameters: z.object({
          category: z.enum(['spa', 'food', 'events', 'general']).describe("Sorunun ait olduğu kategori"),
          question: z.string().describe("Öğrenilen yeni soru"),
          explanation: z.string().describe("Bu sorunun neden önemli olduğu açıklaması")
        }),
        generate: async function* ({ category, question, explanation }) {
          const toolCallId = generateId();

          // Update AI state with new learned question
          const currentState = aiState.get();
          const updatedQuestions = { ...currentState.learnedQuestions };
          
          if (!updatedQuestions[category].includes(question)) {
            updatedQuestions[category].push(question);
          }

          aiState.update({
            ...currentState,
            learnedQuestions: updatedQuestions
          });

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "learnNewQuestion",
                  args: { category, question, explanation },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "learnNewQuestion",
                  toolCallId,
                  result: `Yeni soru öğrenildi: "${question}" - ${category} kategorisinde`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Yeni Soru Öğrenildi!
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>Kategori:</strong> {category === 'spa' ? 'SPA' : category === 'food' ? 'Yemek' : category === 'events' ? 'Etkinlik' : 'Genel'}</p>
                <p><strong>Soru:</strong> "{question}"</p>
                <p><strong>Açıklama:</strong> {explanation}</p>
                <p className="text-green-700 dark:text-green-300 font-medium">
                  ✅ Artık {category === 'spa' ? 'SPA' : category === 'food' ? 'yemek' : category === 'events' ? 'etkinlik' : 'genel'} kategorisinde bu soruyu da soracağım!
                </p>
              </div>
            </div>
          } />;
        },
      },
      showLearnedQuestions: {
        description: "Daha önce öğrenilen tüm soruları göster",
        parameters: z.object({
          category: z.enum(['spa', 'food', 'events', 'general', 'all']).optional().describe("Hangi kategorinin sorularını göstereceği, 'all' tümünü gösterir")
        }),
        generate: async function* ({ category = 'all' }) {
          const toolCallId = generateId();

          const currentState = aiState.get();
          const learnedQuestions = currentState.learnedQuestions;

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "showLearnedQuestions",
                  args: { category },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showLearnedQuestions",
                  toolCallId,
                  result: `Öğrenilen sorular gösteriliyor`,
                },
              ],
            },
          ]);

          const categoryNames = {
            spa: 'SPA Rezervasyonu',
            food: 'Yemek Siparişi', 
            events: 'Etkinlik Rezervasyonu',
            general: 'Genel Sorular'
          };

          const categoriesToShow = category === 'all' 
            ? ['spa', 'food', 'events', 'general'] as const
            : [category] as const;

          return <Message role="assistant" content={
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Öğrendiğim Sorular
              </h4>
              <div className="space-y-4">
                {categoriesToShow.map((cat) => (
                  <div key={cat} className="border-l-4 border-blue-300 pl-3">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      {categoryNames[cat]}
                    </h5>
                    {learnedQuestions[cat].length > 0 ? (
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        {learnedQuestions[cat].map((question, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>"{question}"</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        Henüz öğrenilen soru yok
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          } />;
        },
      },
      acceptInstruction: {
        description: "Admin'den gelen özel talimatı kabul et ve onaylama mesajı göster",
        parameters: z.object({
          instruction: z.string().describe("Admin'den gelen özel talimat"),
          category: z.enum(['spa', 'food', 'events', 'general']).describe("Talimatın ait olduğu kategori"),
          willApply: z.boolean().describe("Bu talimatı uygulayacak mısın")
        }),
        generate: async function* ({ instruction, category, willApply }) {
          const toolCallId = generateId();

          // Update AI state with new instruction
          if (willApply) {
            const currentState = aiState.get();
            const updatedInstructions = { ...currentState.instructions };
            
            if (!updatedInstructions[category].includes(instruction)) {
              updatedInstructions[category].push(instruction);
            }

            aiState.update({
              ...currentState,
              instructions: updatedInstructions
            });
          }

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "acceptInstruction",
                  args: { instruction, category, willApply },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "acceptInstruction",
                  toolCallId,
                  result: `Talimat kabul edildi: "${instruction}" - ${category} kategorisinde`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {willApply ? "Talimat Kabul Edildi!" : "Talimat Alındı"}
              </h4>
                             <div className="space-y-2 text-sm">
                <p><strong>Kategori:</strong> {category === 'spa' ? 'SPA' : category === 'food' ? 'Yemek' : category === 'events' ? 'Etkinlik' : 'Genel'}</p>
                <p><strong>Talimatınız:</strong> "{instruction}"</p>
                <p className="text-orange-700 dark:text-orange-300 font-medium">
                  {willApply ? 
                    "✅ Tamam, dikkate alırım! Şimdi bu talimata göre hizmetleri düzenleyeceğim." :
                    "📝 Anladım, bu konuyu not aldım."}
                </p>
              </div>
            </div>
          } />;
        },
      },
      showInstructions: {
        description: "Daha önce alınan tüm talimatları göster",
        parameters: z.object({
          category: z.enum(['spa', 'food', 'events', 'general', 'all']).optional().describe("Hangi kategorinin talimatlarını göstereceği")
        }),
        generate: async function* ({ category = 'all' }) {
          const toolCallId = generateId();

          const currentState = aiState.get();
          const instructions = currentState.instructions;

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "showInstructions",
                  args: { category },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "showInstructions",
                  toolCallId,
                  result: `Alınan talimatlar gösteriliyor`,
                },
              ],
            },
          ]);

          const categoryNames = {
            spa: 'SPA',
            food: 'Yemek ve İçecek', 
            events: 'Etkinlik',
            general: 'Genel'
          };

          const categoriesToShow = category === 'all' 
            ? ['spa', 'food', 'events', 'general'] as const
            : [category] as const;

          return <Message role="assistant" content={
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Alınan Talimatlar
              </h4>
              <div className="space-y-4">
                {categoriesToShow.map((cat) => (
                  <div key={cat} className="border-l-4 border-purple-300 pl-3">
                    <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                      {categoryNames[cat]}
                    </h5>
                    {instructions[cat].length > 0 ? (
                      <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                        {instructions[cat].map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-500">📋</span>
                            <span>"{instruction}"</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-purple-600 dark:text-purple-400 italic">
                        Henüz talimat yok
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          } />;
        },
      },

    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export interface LearnedQuestions {
  spa: string[];
  food: string[];
  events: string[];
  general: string[];
}

export interface Instructions {
  spa: string[];
  food: string[];
  events: string[];
  general: string[];
}

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
  learnedQuestions: LearnedQuestions;
  instructions: Instructions;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
    learnedQuestions: {
      spa: [],
      food: [],
      events: [],
      general: []
    },
    instructions: {
      spa: [],
      food: [],
      events: [],
      general: []
    }
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
