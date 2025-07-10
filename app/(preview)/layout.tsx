import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { AI } from "./actions";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-sdk-preview-rsc-genui.vercel.dev"),
  title: "Otel Asistanı - Yapay Zeka Chatbot",
  description: "Otel hizmetleri için yapay zeka destekli chatbot. SPA, restoran, etkinlikler ve PDF analizi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-center" richColors />
        <AI>{children}</AI>
      </body>
    </html>
  );
}
