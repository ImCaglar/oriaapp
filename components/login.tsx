"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showStorage, setShowStorage] = useState(false);

  useEffect(() => {
    // Check if there's stored login data
    const hasStoredData = localStorage.getItem("hotel_logged_in");
    if (hasStoredData) {
      setShowStorage(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simple local authentication
    if (username === "admin" && password === "123456") {
      localStorage.setItem("hotel_logged_in", "true");
      onLogin();
    } else {
      setError("Kullanıcı adı veya şifre hatalı");
    }
    
    setIsLoading(false);
  };

  const clearStorage = () => {
    localStorage.clear();
    setShowStorage(false);
    setError("");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-light text-white mb-4"
          >
            🏨 Otel Asistanı
          </motion.h1>
          <p className="text-xl text-gray-400 font-light">
            Giriş yapın
          </p>
        </div>

        {/* Storage Warning */}
        {showStorage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 px-4 py-3 rounded-lg text-sm mb-6"
          >
            <div className="flex items-center justify-between">
              <span>⚠️ Oturum verisi bulundu</span>
              <button
                onClick={clearStorage}
                className="text-yellow-300 hover:text-yellow-100 underline text-xs"
              >
                Temizle
              </button>
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 transition-colors text-base"
              placeholder="Kullanıcı adı"
              required
            />
          </div>

          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 transition-colors text-base"
              placeholder="Şifre"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 transition-colors duration-200 text-base"
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </motion.form>

        {/* Demo Credentials */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">
              <strong>Demo Giriş Bilgileri:</strong>
            </p>
            <p className="text-white font-mono text-base">
              admin / 123456
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}; 