"use client";

import { motion } from "framer-motion";
import { BotIcon, UserIcon } from "./icons";
import { ReactNode } from "react";
import { StreamableValue, useStreamableValue } from "ai/rsc";
import { Markdown } from "./markdown";

export const TextStreamMessage = ({
  content,
}: {
  content: StreamableValue;
}) => {
  const [text] = useStreamableValue(content);

  return (
    <motion.div
      className="flex justify-start mb-6"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex items-start gap-4 max-w-[85%]">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
          </svg>
        </div>
        <div className="bg-gray-50 rounded-3xl rounded-tl-lg px-6 py-4 shadow-sm border border-gray-100">
          <div className="text-gray-800 text-base leading-relaxed font-['Inter',_'system-ui',_sans-serif]">
            <Markdown>{text}</Markdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Message = ({
  role,
  content,
}: {
  role: "assistant" | "user";
  content: string | ReactNode;
}) => {
  const isUser = role === "user";
  
  return (
    <motion.div
      className={`flex mb-6 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ 
        x: isUser ? 50 : -50, 
        opacity: 0, 
        scale: 0.9 
      }}
      animate={{ 
        x: 0, 
        opacity: 1, 
        scale: 1 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        opacity: { duration: 0.3 }
      }}
    >
      <div className={`flex items-start gap-4 max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md ${
          isUser 
            ? "bg-blue-600" 
            : "bg-gray-700"
        }`}>
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
            </svg>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`rounded-3xl px-6 py-4 shadow-sm relative ${
          isUser
            ? "bg-white rounded-tr-lg text-gray-800 border border-gray-100"
            : "bg-gray-50 rounded-tl-lg text-gray-800 border border-gray-100"
        }`}>
          <div className="text-base leading-relaxed font-['Inter',_'system-ui',_sans-serif] antialiased">
            {typeof content === "string" ? (
              <Markdown>{content}</Markdown>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
