
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { GeneralSettings } from "@/lib/types";

export function PromotionBanner() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
        setBannerImage(data.bannerImage || null);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    fetchSettings();
  }, []);

  if (!settings || !settings.bannerEnabled || !bannerImage) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="relative w-full aspect-video md:aspect-[3/1] rounded-lg overflow-hidden">
        <Image
          src={bannerImage}
          alt="Banner Promosi"
          fill
          className="object-cover"
          unoptimized // For data URLs or base64 images
        />
      </div>
    </div>
  );
}

