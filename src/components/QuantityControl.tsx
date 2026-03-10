'use client';

interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

export default function QuantityControl({ value, onChange, min = 0 }: QuantityControlProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-700 transition-colors active:bg-gray-300 disabled:opacity-40 disabled:active:bg-gray-200"
        aria-label="수량 감소"
      >
        &minus;
      </button>
      <span className="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-xl font-bold text-white transition-colors active:bg-blue-600"
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  );
}
