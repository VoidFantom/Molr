import React, { useState, useEffect } from 'react';

const LOADING_TEXTS = [
  "Building this...",
  "Almost done...",
  "Just a moment...",
  "Putting things together...",
  "Hang tight..."
];

export default function Loader() {
  const [elapsed, setElapsed] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(seconds);
      
      if (seconds > 0 && seconds % 2 === 0) {
        setTextIndex(prev => (prev + 1) % LOADING_TEXTS.length);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (elapsed < 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px] gap-4">
      {elapsed < 10 ? (
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <div className="w-full max-w-[240px] h-2 bg-border-color rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
          <div className="h-full bg-primary rounded-full animate-pulse w-full"></div>
        </div>
      )}
      <div className="text-sm font-medium text-muted animate-pulse">
        {LOADING_TEXTS[textIndex]}
      </div>
    </div>
  );
}
