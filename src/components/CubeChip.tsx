'use client';

interface CubeChipProps {
  name: string;
  children: React.ReactNode;
  onNameClick?: () => void;
}

export default function CubeChip({ name, children, onNameClick }: CubeChipProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white pl-1.5 pr-1 py-0.5 shadow-sm">
      {onNameClick ? (
        <button
          type="button"
          onClick={onNameClick}
          className="text-xs font-medium text-gray-700 whitespace-nowrap hover:text-blue-600 hover:underline cursor-pointer"
        >
          {name}
        </button>
      ) : (
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{name}</span>
      )}
      <div className="flex flex-wrap gap-[2px] items-center">
        {children}
      </div>
    </div>
  );
}
