"use client";

import { CALENDAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CALENDAR_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          title={color.label}
          onClick={() => onChange(color.value)}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
            value === color.value
              ? "border-foreground scale-110"
              : "border-transparent"
          )}
          style={{ backgroundColor: color.value }}
        />
      ))}
    </div>
  );
}
