export interface PDFCategory {
  id: string;
  name: string;
  description: string;
}

export const PDF_CATEGORIES: PDFCategory[] = [
  { id: 'spa', name: 'SPA Menü', description: 'Masaj, tedavi ve wellness hizmetleri' },
  { id: 'food', name: 'Yemek ve İçecek', description: 'Restoran menüsü, yemekler ve içecekler' },
  { id: 'events', name: 'Etkinlik Programı', description: 'Günlük aktiviteler ve etkinlikler' },
  { id: 'services', name: 'Otel Hizmetleri', description: 'Oda servisi ve diğer hizmetler' },
  { id: 'other', name: 'Diğer', description: 'Genel otel bilgileri' }
];

export interface ExtractedPDFData {
  text: string;
  category: string;
  filename: string;
  extractedAt: Date;
}

export async function extractPdfText(file: File): Promise<string> {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n=== Sayfa ${pageNum} ===\n${pageText}\n`;
    }
    
    if (fullText.trim()) {
      return `📄 PDF İçeriği Başarıyla Çıkarıldı: ${file.name}
📊 Dosya Boyutu: ${(file.size / 1024 / 1024).toFixed(2)} MB
📄 Sayfa Sayısı: ${pdf.numPages}
📅 İşlem Tarihi: ${new Date().toLocaleDateString('tr-TR')}

📝 ÇİKARILAN METİN İÇERİĞİ:
${fullText.trim()}

✅ PDF içeriği başarıyla okundu! Şimdi bu içerik hakkında sorularınızı yanıtlayabilirim.`;
    } else {
      return getFallbackMessage(file);
    }
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return getFallbackMessage(file);
  }
}

function getFallbackMessage(file: File): string {
  return `📄 PDF Yüklendi: ${file.name}
📊 Dosya Boyutu: ${(file.size / 1024 / 1024).toFixed(2)} MB
📅 Yüklenme Tarihi: ${new Date().toLocaleDateString('tr-TR')}

⚠️ PDF İçerik Çıkarma Sorunu

PDF dosyasından otomatik metin çıkarma işlemi başarısız oldu. Bu durumda:

1. 🗣️ PDF içeriğini bana tarif edebilirsiniz
2. 📋 Ana kategoriler hakkında genel sorular sorabilirim  
3. 💡 Tipik hizmetler önerebilirim

Devam etmek için PDF'inizin içeriği hakkında bana bilgi verin!`;
}

export function convertPdfTextToMarkdown(rawText: string, category: string, fileName: string): string {
  // Extract the actual content from the formatted PDF text
  const contentMatch = rawText.match(/📝 ÇİKARILAN METİN İÇERİĞİ:\s*([\s\S]*?)(?:\n✅|$)/);
  const actualContent = contentMatch ? contentMatch[1].trim() : rawText;
  
  let markdown = `# ${category} - PDF Analizi\n\n`;
  markdown += `**Dosya:** ${fileName}\n`;
  markdown += `**Kategori:** ${category}\n`;
  markdown += `**Analiz Tarihi:** ${new Date().toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n\n`;
  markdown += `---\n\n`;

  // Split content by pages
  const pages = actualContent.split(/=== Sayfa \d+ ===/);
  
  if (pages.length > 1) {
    markdown += `## PDF İçeriği (${pages.length - 1} Sayfa)\n\n`;
    
    pages.forEach((pageContent, index) => {
      if (index === 0 || !pageContent.trim()) return;
      
      markdown += `### Sayfa ${index}\n\n`;
      markdown += formatPageContent(pageContent.trim(), category);
      markdown += `\n---\n\n`;
    });
  } else {
    markdown += `## PDF İçeriği\n\n`;
    markdown += formatPageContent(actualContent, category);
  }

  return markdown;
}

function formatPageContent(content: string, category: string): string {
  let formatted = content;

  // Clean up extra whitespace
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  // Format based on category type
  switch (category.toLowerCase()) {
    case 'spa':
    case 'spa menü':
      formatted = formatSpaContent(formatted);
      break;
          case 'food':
      case 'yemek listesi':
      case 'yemek ve içecek':
        formatted = formatFoodContent(formatted);
        break;
    case 'events':
    case 'etkinlik programı':
      formatted = formatEventsContent(formatted);
      break;
    default:
      formatted = formatGeneralContent(formatted);
      break;
  }

  return formatted;
}

function formatSpaContent(content: string): string {
  let formatted = content;
  
  // Format prices
  formatted = formatted.replace(/(\d+)\s*[€$₺]/g, '**$1€**');
  formatted = formatted.replace(/[€$₺]\s*(\d+)/g, '**€$1**');
  
  // Format durations
  formatted = formatted.replace(/(\d+)\s*(dakika|dk|min|minute)/gi, '**$1 dakika**');
  formatted = formatted.replace(/(\d+\.?\d*)\s*(saat|hour|hr)/gi, '**$1 saat**');
  
  // Format service names (capitalize words that might be service names)
  formatted = formatted.replace(/\b(masaj|massage|tedavi|treatment|bakım|care|terapi|therapy)\b/gi, '**$1**');
  
  return formatted;
}

function formatFoodContent(content: string): string {
  let formatted = content;
  
  // Format prices
  formatted = formatted.replace(/(\d+)\s*[€$₺]/g, '**$1€**');
  formatted = formatted.replace(/[€$₺]\s*(\d+)/g, '**€$1**');
  
  // Format food categories
  formatted = formatted.replace(/\b(ana yemek|appetizer|meze|main course|dessert|tatlı|içecek|drink|beverage)\b/gi, '**$1**');
  
  return formatted;
}

function formatEventsContent(content: string): string {
  let formatted = content;
  
  // Format dates
  formatted = formatted.replace(/(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/gi, '**$1 $2**');
  formatted = formatted.replace(/(\d{1,2})[-.](\d{1,2})[-.](\d{4})/g, '**$1.$2.$3**');
  formatted = formatted.replace(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/g, '**$3.$2.$1**');
  
  // Format times
  formatted = formatted.replace(/(\d{1,2}):(\d{2})/g, '**$1:$2**');
  formatted = formatted.replace(/(\d{1,2})\s*(am|pm)/gi, '**$1 $2**');
  
  // Format days of week
  formatted = formatted.replace(/\b(pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '**$1**');
  
  // Format event types
  formatted = formatted.replace(/\b(etkinlik|event|aktivite|activity|program|programme)\b/gi, '**$1**');
  
  return formatted;
}

function formatGeneralContent(content: string): string {
  let formatted = content;
  
  // Format any prices found
  formatted = formatted.replace(/(\d+)\s*[€$₺]/g, '**$1€**');
  formatted = formatted.replace(/[€$₺]\s*(\d+)/g, '**€$1**');
  
  // Format any times found
  formatted = formatted.replace(/(\d{1,2}):(\d{2})/g, '**$1:$2**');
  
  return formatted;
}

// Legacy function - keeping for backward compatibility but removing sample data
export function generateMarkdownFromText(
  text: string, 
  category: string, 
  userQuery: string
): string {
  return convertPdfTextToMarkdown(text, category, 'document.pdf');
}

export async function savePDFAnalysis(
  filename: string,
  category: string,
  userQuery: string,
  extractedText: string
): Promise<string> {
  const markdown = convertPdfTextToMarkdown(extractedText, category, filename);
  
  console.log('PDF Analysis saved as Markdown:', { filename, category, userQuery });
  
  return markdown;
} 