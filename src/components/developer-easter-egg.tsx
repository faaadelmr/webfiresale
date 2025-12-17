"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Globe, X, Sparkles, Star } from "lucide-react";

export function DeveloperEasterEgg() {
    const [isVisible, setIsVisible] = useState(false);
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        setPressedKeys(prev => new Set(prev).add(key));
    }, []);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        setPressedKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
    }, []);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Check if F + M + R are pressed together
    useEffect(() => {
        if (pressedKeys.has("f") && pressedKeys.has("m") && pressedKeys.has("r")) {
            setIsVisible(true);
            setPressedKeys(new Set()); // Reset to prevent multiple triggers
        }
    }, [pressedKeys]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop with floating stars */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-amber-900/80 via-yellow-900/70 to-orange-900/80 backdrop-blur-sm overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsVisible(false)}
                    >
                        {/* Floating cartoon stars */}
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-yellow-300"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            >
                                <Star className="h-6 w-6 fill-yellow-300" />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Modal - Cartoon Style */}
                    <motion.div
                        className="relative z-10 w-full max-w-sm mx-4"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 10 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    >
                        {/* Cartoon Card */}
                        <div
                            className="relative overflow-visible"
                            style={{
                                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
                            }}
                        >
                            {/* Main Card Body */}
                            <div
                                className="relative rounded-3xl p-1"
                                style={{
                                    background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #D97706 100%)",
                                }}
                            >
                                <div
                                    className="rounded-3xl p-6 relative overflow-hidden"
                                    style={{
                                        background: "linear-gradient(180deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)",
                                        border: "4px solid #92400E",
                                    }}
                                >
                                    {/* Cartoon shine effect */}
                                    <div
                                        className="absolute top-0 left-0 w-full h-1/3 rounded-t-3xl opacity-50"
                                        style={{
                                            background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)",
                                        }}
                                    />

                                    {/* Close button - Cartoon style */}
                                    <motion.button
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-20"
                                        style={{
                                            background: "#EF4444",
                                            border: "3px solid #991B1B",
                                            boxShadow: "0 3px 0 #991B1B",
                                        }}
                                        onClick={() => setIsVisible(false)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9, y: 2 }}
                                    >
                                        <X className="h-4 w-4 text-white font-bold" />
                                    </motion.button>

                                    {/* Sparkle decorations */}
                                    <motion.div
                                        className="absolute top-4 left-4"
                                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Sparkles className="h-6 w-6 text-amber-600" />
                                    </motion.div>

                                    <div className="flex flex-col items-center text-center relative z-10 pt-2">
                                        {/* Avatar with cartoon border */}
                                        <motion.div
                                            className="relative mb-4"
                                            initial={{ scale: 0, y: -50 }}
                                            animate={{ scale: 1, y: 0 }}
                                            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                        >
                                            {/* Glow effect */}
                                            <div
                                                className="absolute inset-0 rounded-full blur-xl opacity-60"
                                                style={{ background: "#FCD34D" }}
                                            />
                                            <div
                                                className="relative w-28 h-28 rounded-full overflow-hidden"
                                                style={{
                                                    border: "5px solid #92400E",
                                                    boxShadow: "0 6px 0 #78350F, 0 8px 20px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                <img
                                                    src="https://avatars.githubusercontent.com/u/189188631?v=4"
                                                    alt="Fadel MRifai"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Crown/Star decoration */}
                                            <motion.div
                                                className="absolute -top-3 -right-2"
                                                animate={{ rotate: [-10, 10, -10] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <Star className="h-8 w-8 text-amber-500 fill-amber-400 drop-shadow-lg" />
                                            </motion.div>
                                        </motion.div>

                                        {/* Name - Cartoon Typography */}
                                        <motion.h2
                                            className="text-2xl font-black mb-1"
                                            style={{
                                                color: "#78350F",
                                                textShadow: "2px 2px 0 #FDE68A, -1px -1px 0 #FDE68A",
                                                fontFamily: "'Comic Sans MS', cursive, sans-serif",
                                            }}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            ✨ Fadel MRifai ✨
                                        </motion.h2>

                                        {/* Role Badge */}
                                        <motion.div
                                            className="px-4 py-1 rounded-full mb-3"
                                            style={{
                                                background: "#F59E0B",
                                                border: "3px solid #92400E",
                                                boxShadow: "0 3px 0 #78350F",
                                            }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span
                                                className="text-sm font-bold"
                                                style={{ color: "#451A03" }}
                                            >
                                                🚀 Full Stack Developer
                                            </span>
                                        </motion.div>

                                        {/* Description */}
                                        <motion.p
                                            className="text-sm font-medium mb-4 px-2"
                                            style={{ color: "#78350F" }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            Creator of WebFireSale 🔥
                                        </motion.p>

                                        {/* Buttons - Cartoon Style */}
                                        <motion.div
                                            className="flex flex-col gap-3 w-full"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <motion.a
                                                href="https://github.com/faaadelmr"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white"
                                                style={{
                                                    background: "#1F2937",
                                                    border: "3px solid #111827",
                                                    boxShadow: "0 4px 0 #111827",
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98, y: 2, boxShadow: "0 2px 0 #111827" }}
                                            >
                                                <Github className="h-5 w-5" />
                                                GitHub - @faaadelmr
                                            </motion.a>

                                            <motion.a
                                                href="https://faaadelmr.pages.dev"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold"
                                                style={{
                                                    background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                                                    border: "3px solid #92400E",
                                                    boxShadow: "0 4px 0 #78350F",
                                                    color: "#451A03",
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98, y: 2, boxShadow: "0 2px 0 #78350F" }}
                                            >
                                                <Globe className="h-5 w-5" />
                                                Portfolio Website
                                            </motion.a>
                                        </motion.div>

                                        {/* Secret hint */}
                                        <motion.p
                                            className="text-xs mt-4 font-medium"
                                            style={{ color: "#92400E" }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                        >
                                            🎮 You found the secret! Press F+M+R anytime ⭐
                                        </motion.p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
