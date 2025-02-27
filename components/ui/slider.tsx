"use client"

import React, { useEffect, useRef, useState } from "react"

interface SliderProps {
  value: number[];
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  disabled = false,
  className = "",
}: SliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbPosition, setThumbPosition] = useState(0);
  
  // Calculate position percentage for custom thumb
  const calculatePosition = () => {
    const percentage = ((value[0] - min) / (max - min)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };
  
  // Update the custom thumb position
  useEffect(() => {
    setThumbPosition(calculatePosition());
  }, [value, min, max]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };
  
  // Keep the fix that prevents duplicate thumbs
  useEffect(() => {
    if (inputRef.current) {
      const input = inputRef.current;
      input.value = value[0].toString();
    }
  }, [value]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Invisible native slider input for functionality */}
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      {/* Custom track */}
      <div 
        ref={trackRef}
        className={`w-full h-[2px] bg-zinc-800 rounded-full overflow-hidden ${disabled ? "opacity-50" : ""}`}
      >
        {/* Filled portion of track */}
        <div 
          className="h-full bg-zinc-600" 
          style={{ width: `${thumbPosition}%` }}
        />
      </div>
      
      {/* Custom thumb bubble */}
      <div 
        className={`absolute top-1/2 -mt-[8px] h-[16px] w-[16px] rounded-full bg-white border-2 border-[#1f2937] shadow-sm pointer-events-none transition-transform duration-100 ease-out
                    ${disabled ? "opacity-50" : ""}
                   `}
        style={{ 
          left: `calc(${thumbPosition}% - 8px)`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
} 