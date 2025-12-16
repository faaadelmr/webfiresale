"use client";

import { useEffect } from 'react';
import { processExpiredItems, processCancelledOrders } from '@/lib/utils';

export default function PeriodicProcessor() {
  useEffect(() => {
    // Process expired items and cancelled orders periodically (every 15 minutes)
    // Since the server now handles this task more frequently via the API endpoint
    processExpiredItems();
    processCancelledOrders();

    // Set interval to 15 minutes instead of 5 minutes since server handles most processing
    const interval = setInterval(() => {
      processExpiredItems();
      processCancelledOrders();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}