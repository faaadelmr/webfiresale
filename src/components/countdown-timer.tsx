"use client";

import { useState, useEffect } from 'react';
import { TimerIcon } from 'lucide-react';

interface CountdownTimerProps {
  saleStartDate?: Date;
  saleEndDate?: Date;
}

export function CountdownTimer({ saleStartDate, saleEndDate }: CountdownTimerProps) {
  const calculateTimeLeft = () => {
    if (!saleStartDate || !saleEndDate) {
      return { timeLeft: {}, prefix: null };
    }

    const now = new Date();
    const start = new Date(saleStartDate);
    const end = new Date(saleEndDate);

    let difference;
    let prefix;

    if (now < start) {
      difference = +start - +now;
      prefix = 'Starts in:';
    } else if (now >= start && now < end) {
      difference = +end - +now;
      prefix = 'Ends in:';
    } else {
      return { timeLeft: {}, prefix: null };
    }

    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return { timeLeft: timeLeft as { days: number; hours: number; minutes: number; seconds: number }, prefix };
  };

  const [timerState, setTimerState] = useState<{ timeLeft: { days?: number; hours?: number; minutes?: number; seconds?: number }; prefix: string | null }>({ timeLeft: {}, prefix: null });

  useEffect(() => {
    // Set initial time on mount to avoid hydration mismatch
    setTimerState(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimerState(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleStartDate, saleEndDate]);

  const { timeLeft, prefix } = timerState;
  const hasTime = prefix !== null && timeLeft.days !== undefined;

  return (
    <div className="mt-2 flex items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
      <TimerIcon className="h-4 w-4" />
      {hasTime ? (
        <span>
          {prefix} {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      ) : (
        <span>Sale Ended</span>
      )}
    </div>
  );
}
