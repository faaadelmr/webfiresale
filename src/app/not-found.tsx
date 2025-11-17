"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-5xl shadow-xl p-6 md:p-10 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col items-center md:items-start">
              <motion.div
                className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                404
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                Oops! Page Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                The page you were looking for seems to be out of where! Don't worry, we've got plenty of other deals waiting for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link href="/">
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back to Store
                  </motion.button>
                </Link>
                
                <Link href="/dashboard">
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Dashboard
                  </motion.button>
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <motion.div 
                className="relative w-64 h-64"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              >
                {/* Shopping cart with fire */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="text-9xl">🛒</div>
                    
                    {/* Fire animation on cart */}
                    <motion.div
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                      animate={{ y: [-10, -20, -10], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      🔥
                    </motion.div>
                  </div>
                  
                  {/* Floating items */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${10 + i * 30}%`,
                      }}
                      animate={{ 
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    >
                      {i === 0 && <div className="text-5xl">👕</div>}
                      {i === 1 && <div className="text-5xl">👖</div>}
                      {i === 2 && <div className="text-5xl">👟</div>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-8 flex justify-center space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="text-5xl"
                    animate={{
                      y: [0, -15, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  >
                    {['📦', '🚚', '🏷️', '💳', '🔥'][i]}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}