
import React, { useState, useEffect } from 'react';

const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    // Update the clock every second
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Get timezone information
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
    } catch (error) {
      console.error("Error getting timezone:", error);
      setTimezone("Unknown");
    }

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col items-end">
      <div className="font-mono text-lg font-bold text-blue-600">
        {formatTime(time)}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {timezone}
      </div>
    </div>
  );
};

export default DigitalClock;
