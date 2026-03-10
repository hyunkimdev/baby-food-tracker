'use client';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-gray-200 overflow-hidden"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <span className="text-sm text-gray-500 font-mono">{value}</span>
    </div>
  );
}
