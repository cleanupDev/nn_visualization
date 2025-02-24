"use client"

import React from "react"

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer ${
          disabled ? "opacity-50" : ""
        }`}
        style={{
          // Basic style overrides for better appearance
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
    </div>
  );
} 