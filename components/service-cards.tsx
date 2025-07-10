"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  category: string;
  date?: string; // Added for event dates
  dateRange?: string; // Added for event date ranges
}

interface ServiceCardsProps {
  services: ServiceItem[];
  category: string;
}

export const ServiceCards = ({ services, category }: ServiceCardsProps) => {
  // Debug logging
  console.log('🔍 ServiceCards Debug:', {
    category: category,
    categoryLower: category.toLowerCase(),
    isFoodCategory: ['food', 'yemek', 'yemek ve içecek', 'food and drinks', 'menu'].includes(category.toLowerCase()),
    isEventCategory: ['events', 'etkinlik', 'etkinlik programı', 'event'].includes(category.toLowerCase())
  });

  const handleBooking = (service: ServiceItem) => {
    const isFoodCategory = ['food', 'yemek', 'yemek ve içecek', 'food and drinks', 'menu'].includes(category.toLowerCase());
    const isEventCategory = ['events', 'etkinlik', 'etkinlik programı', 'event'].includes(category.toLowerCase());
    
    console.log('🔍 Button Click Debug:', {
      category: category,
      isFoodCategory,
      isEventCategory,
      service: service.title
    });
    
    if (isFoodCategory) {
      alert(`🍽️ Sipariş talebiniz alındı!\n\n🥘 Yemek/İçecek: ${service.title}\n💰 Fiyat: ${service.price || 'Fiyat bilgisi mevcut değil'}\n⏱️ Hazırlanma Süresi: ${service.duration || 'Süre bilgisi mevcut değil'}\n\n📞 Oda servisimiz kısa sürede sizinle iletişime geçecek!\n🚪 Odanıza teslim edilecektir.`);
    } else if (isEventCategory) {
      const dateInfo = service.date || service.dateRange || 'Tarih bilgisi mevcut değil';
      alert(`🎉 Etkinlik kaydınız alındı!\n\n🎯 Etkinlik: ${service.title}\n💰 Katılım Ücreti: ${service.price || 'Ücretsiz'}\n⏱️ Süre: ${service.duration || 'Süre bilgisi mevcut değil'}\n📅 Tarih: ${dateInfo}\n\n📞 Etkinlik detayları için sizinle iletişime geçeceğiz!`);
    } else {
      const dateInfo = service.date || service.dateRange || 'Tarih bilgisi mevcut değil';
      alert(`✨ Randevu talebiniz alındı!\n\n🎯 Hizmet: ${service.title}\n💰 Fiyat: ${service.price || 'Fiyat bilgisi mevcut değil'}\n⏱️ Süre: ${service.duration || 'Süre bilgisi mevcut değil'}\n📅 Tarih: ${dateInfo}\n\n📞 Kısa sürede sizinle iletişime geçeceğiz!`);
    }
    
    console.log('Booking requested for:', service);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'spa':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'food':
      case 'yemek':
      case 'yemek ve içecek':
      case 'food and drinks':
      case 'menu':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
          </svg>
        );
      case 'events':
      case 'etkinlik':
      case 'etkinlik programı':
      case 'event':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category.toLowerCase()) {
      case 'spa':
        return 'from-emerald-500 to-teal-600';
      case 'food':
      case 'yemek':
      case 'yemek ve içecek':
      case 'food and drinks':
      case 'menu':
        return 'from-orange-500 to-red-500';
      case 'events':
      case 'etkinlik':
      case 'etkinlik programı':
      case 'event':
        return 'from-purple-500 to-indigo-600';
      default:
        return 'from-blue-500 to-cyan-600';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category.toLowerCase()) {
      case 'spa':
        return 'bg-emerald-50 border-emerald-200';
      case 'food':
      case 'yemek':
      case 'yemek ve içecek':
      case 'food and drinks':
      case 'menu':
        return 'bg-orange-50 border-orange-200';
      case 'events':
      case 'etkinlik':
      case 'etkinlik programı':
      case 'event':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const isEventCategory = (category: string) => {
    return ['events', 'etkinlik', 'etkinlik programı', 'event'].includes(category.toLowerCase());
  };

  const isFoodCategory = (category: string) => {
    return ['food', 'yemek', 'yemek ve içecek', 'food and drinks', 'menu'].includes(category.toLowerCase());
  };

  const getButtonText = (category: string) => {
    if (isFoodCategory(category)) {
      return 'Sipariş Ver';
    } else if (isEventCategory(category)) {
      return 'Etkinliğe Katıl';
    } else {
      return 'Hemen Randevu Al';
    }
  };

  const getButtonIcon = (category: string) => {
    if (isFoodCategory(category)) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6zm0 3a1 1 0 012 0 1 1 0 11-2 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (isEventCategory(category)) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hizmet bulunamadı</h3>
        <p className="text-gray-500 text-sm">Bu kategoride gösterilecek hizmet bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Category Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className={`p-3 rounded-lg bg-gradient-to-br ${getCategoryGradient(category)} text-white shadow-lg`}>
          {getCategoryIcon(category)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 capitalize">
            {category} {isEventCategory(category) ? 'Etkinlikleri' : isFoodCategory(category) ? 'Menüsü' : 'Hizmetleri'}
          </h3>
          <p className="text-gray-600 font-medium">
            {services.length} adet {isEventCategory(category) ? 'etkinlik' : isFoodCategory(category) ? 'öğe' : 'premium hizmet'}
          </p>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.2 }
            }}
            className={`relative bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${getCategoryBg(category)} group`}
          >
            {/* Gradient Top Bar */}
            <div className={`h-2 bg-gradient-to-r ${getCategoryGradient(category)}`} />
            
            {/* Card Content */}
            <div className="p-6">
              {/* Service Title */}
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors">
                  {service.title}
                </h4>
                <div className={`p-2 rounded-md bg-gradient-to-br ${getCategoryGradient(category)} text-white shadow-md`}>
                  {getCategoryIcon(category)}
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                {service.description}
              </p>

              {/* Service Details */}
              <div className="space-y-3 mb-6">
                {/* Date Range for Events */}
                {isEventCategory(category) && (service.date || service.dateRange) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-md border border-purple-200"
                  >
                    <div className="p-2 bg-purple-100 rounded-md">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-purple-800 uppercase tracking-wide">Tarih</p>
                      <p className="text-sm font-semibold text-purple-700">{service.dateRange || service.date}</p>
                    </div>
                  </motion.div>
                )}

                {service.price && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-md border border-green-200"
                  >
                    <div className="p-2 bg-green-100 rounded-md">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-800 uppercase tracking-wide">
                        {isEventCategory(category) ? 'Katılım Ücreti' : 'Fiyat'}
                      </p>
                      <p className="text-lg font-bold text-green-700">{service.price}</p>
                    </div>
                  </motion.div>
                )}
                
                {service.duration && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border border-blue-200"
                  >
                    <div className="p-2 bg-blue-100 rounded-md">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">
                        {isFoodCategory(category) ? 'Hazırlanma Süresi' : 'Süre'}
                      </p>
                      <p className="text-sm font-semibold text-blue-700">{service.duration}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBooking(service)}
                className={`w-full bg-gradient-to-r ${getCategoryGradient(category)} text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-xl`}
              >
                {getButtonIcon(category)}
                {getButtonText(category)}
              </motion.button>
            </div>

            {/* Decorative corner */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${getCategoryGradient(category)} opacity-10 rounded-bl-3xl`} />
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
      >
        <p className="text-center text-sm text-gray-600">
          ✨ <strong>
            {isEventCategory(category) ? 'Etkinlik tarihleri ve bilgiler' : isFoodCategory(category) ? 'Fiyat ve menü bilgileri' : 'Fiyat ve bilgiler'} PDF dokümanından alınmıştır.
          </strong> Güncel bilgiler için lütfen iletişime geçin.
        </p>
      </motion.div>
    </div>
  );
}; 