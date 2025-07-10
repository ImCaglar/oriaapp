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

  let systemPrompt = `\
      - Sen deneyimli ve yardımsever bir otel asistanısın
      - Türkçe konuşuyorsun ve misafirlere yardım ediyorsun
      - Kibar, profesyonel ve çözüm odaklı bir yaklaşım sergile
    `;

  if (hasPdfData && hasCategory) {
    systemPrompt += `\
      - Kullanıcı PDF yükledi ve içerik Markdown formatında yapılandırıldı
      - SADECE PDF'deki gerçek verileri kullan, hiçbir şey uydurma
      - Markdown içeriğini analiz et ve hizmet bilgilerini çıkar
      - **bold** formatındaki fiyat ve süreleri özellikle dikkate al
      - Fiyatları şu formatlardan tespit et: **€123**, **123€**, **$123**, **123₺**
      - Süreleri şu formatlardan tespit et: **60 dakika**, **1 saat**, **90 dk**
      - analyzeServices tool'unu kullanarak hizmetleri kart formatında göster
      - Her kartın title, description, price, duration bilgilerini tamamen Markdown'dan al
      - Etkinlik kategorisinde date veya dateRange bilgisini de ekle (tarih, gün, zaman)
      - Markdown'da fiyat yoksa price alanını boş bırak, süre yoksa duration alanını boş bırak
      - Etkinlik kategorisinde tarih bilgisi yoksa date alanını boş bırak
      - Markdown'da olmayan bilgileri asla ekleme, varsayma veya tahmin etme
      - Hizmet açıklamalarını Markdown'daki gerçek metinlerden oluştur
      - Sayfa başlıklarını ve yapılandırılmış içeriği kullan
      
      ÖNEMLİ KATEGORI KURALLARI:
      - Eğer kategori "Yemek ve İçecek" ise, category parametresini "yemek ve içecek" olarak geç
      - Eğer kategori "SPA" ise, category parametresini "spa" olarak geç  
      - Eğer kategori "Etkinlik Programı" ise, category parametresini "etkinlik" olarak geç
      - analyzeServices'te category parametresi buton metnini belirler:
        * "yemek ve içecek" → "Sipariş Ver" butonu
        * "spa" → "Hemen Randevu Al" butonu
        * "etkinlik" → "Etkinliğe Katıl" butonu
    `;
  } else if (hasCategory) {
    systemPrompt += `\
      - PDF içeriği mevcut değil, kullanıcıdan PDF yüklemesini iste
      - "PDF analizi için lütfen menü, broşür veya hizmet listesi yükleyin" de
      - Genel otel bilgileri vermek yerine PDF yükleme konusunda yönlendir
    `;
  } else {
    systemPrompt += `\
      - PDF içeriği olmadığında kullanıcıdan PDF yüklemesini iste
      - Genel otel sorularına kısaca yanıt ver ama PDF yüklemeyi öner
      - showHotelInfo tool'unu sadece genel otel bilgileri istenirse kullan
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
        description: "PDF'den çıkarılan gerçek verileri kullanarak hizmetleri analiz et ve kartlar halinde göster. Sadece PDF'de bulunan bilgileri kullan. Kategori 'Yemek ve İçecek' ise buton 'Sipariş Ver' olacak.",
        parameters: z.object({
          services: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            price: z.string().optional(),
            duration: z.string().optional(),
            category: z.string().describe("Hizmet kategorisi: 'spa', 'yemek ve içecek', 'etkinlik', 'otel hizmetleri'"),
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

    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
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
