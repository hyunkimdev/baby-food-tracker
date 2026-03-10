'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Cube, CubeCategory, StorageType } from '@/types';
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants';
import CubeBlock from './CubeBlock';
import { getExpiryWarnDays } from './SettingsModal';

interface IngredientShelfProps {
  cubes: Cube[];
  selections: Record<string, number>;
  onAddToPlate: (id: string) => void;
  onAddCube: (storage: StorageType) => void;
  onEditCube: (cube: Cube) => void;
}


function DraggableBlock({ cube, index, isUsed, onDoubleClick }: {
  cube: Cube; index: number; isUsed: boolean; onDoubleClick: () => void;
}) {
  const dragId = `shelf__${cube.id}__${index}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { cube, source: 'shelf' },
    disabled: isUsed || (cube.itemType !== 'cube' && cube.itemType !== 'blw'),
  });

  const style: React.CSSProperties = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 9999, position: 'relative' }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onDoubleClick={isUsed || (cube.itemType !== 'cube' && cube.itemType !== 'blw') ? undefined : onDoubleClick}
      className={`transition-opacity ${
        isUsed
          ? 'cursor-not-allowed'
          : isDragging
          ? 'shadow-lg opacity-80 cursor-grabbing ring-1 ring-blue-400 rounded-[3px]'
          : 'cursor-grab hover:opacity-80'
      }`}
      title={isUsed ? '식판에 사용 중' : cube.itemType !== 'cube' && cube.itemType !== 'blw' ? '캘린더에 추가 불가' : '더블클릭: 식판으로 이동'}
    >
      <CubeBlock color={cube.color} weight={cube.weight} dimmed={isUsed} itemType={cube.itemType} />
    </div>
  );
}

function getExpiryDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getMostUrgentExpiry(cubes: Cube[]): { status: 'expired' | 'warning' | null; label: string | null } {
  let mostUrgentDiff: number | null = null;
  for (const c of cubes) {
    if (!c.expiryDate) continue;
    const diff = getExpiryDiff(c.expiryDate);
    if (mostUrgentDiff === null || diff < mostUrgentDiff) {
      mostUrgentDiff = diff;
    }
  }
  if (mostUrgentDiff === null) return { status: null, label: null };
  const status = mostUrgentDiff < 0 ? 'expired' : mostUrgentDiff <= getExpiryWarnDays() ? 'warning' : null;
  const label = mostUrgentDiff < 0 ? `${-mostUrgentDiff}일 지남` : mostUrgentDiff === 0 ? '오늘 만료' : `${mostUrgentDiff}일 남음`;
  return { status, label };
}

function formatMadeLabel(cubes: Cube[]): string | null {
  // Find earliest made date among cubes
  let earliest: string | null = null;
  for (const c of cubes) {
    if (!c.madeDate) continue;
    if (!earliest || c.madeDate < earliest) earliest = c.madeDate;
  }
  if (!earliest) return null;
  const diff = -getExpiryDiff(earliest);
  if (diff <= 0) return '오늘 제조';
  return `제조 ${diff}일째`;
}

function ItemCard({ cubes, selections, onAddToPlate, onEdit }: {
  cubes: Cube[]; selections: Record<string, number>; onAddToPlate: (id: string) => void; onEdit: () => void;
}) {
  const totalQty = cubes.reduce((s, c) => s + c.quantity, 0);
  if (totalQty === 0) return null;

  const { status: expiryStatus, label: expiryLabel } = getMostUrgentExpiry(cubes);
  const madeLabel = formatMadeLabel(cubes);
  const borderColor = expiryStatus === 'expired' ? 'border-red-400' : expiryStatus === 'warning' ? 'border-orange-400' : 'border-gray-200';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border ${borderColor} bg-white pl-2 pr-1.5 py-1 shadow-sm`}>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-gray-700 whitespace-nowrap hover:text-blue-600 hover:underline cursor-pointer text-left"
        >
          {cubes[0].name}
        </button>
        {madeLabel && (
          <span className="text-[10px] leading-tight text-gray-400">{madeLabel}</span>
        )}
        {expiryLabel && (
          <span className={`text-[10px] leading-tight ${expiryStatus === 'expired' ? 'text-red-500 font-bold' : 'text-orange-500'}`}>
            {expiryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-[3px] items-end">
        {cubes.map((cube) => {
          const usedCount = selections[cube.id] ?? 0;
          const remaining = cube.quantity - usedCount;
          return Array.from({ length: cube.quantity }).map((_, i) => (
            <DraggableBlock
              key={`${cube.id}-${i}`} cube={cube} index={i} isUsed={i >= remaining}
              onDoubleClick={() => onAddToPlate(cube.id)}
            />
          ));
        })}
      </div>
    </div>
  );
}

function StorageSection({
  title, icon, storageType, cubes, selections, className, droppableId,
  onAddToPlate, onAddCube, onEditCube,
}: {
  title: string; icon: React.ReactNode; storageType: StorageType;
  cubes: Cube[]; selections: Record<string, number>; className?: string;
  droppableId: string; onAddToPlate: (id: string) => void;
  onAddCube: () => void; onEditCube: (cube: Cube) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });

  const storageCubes = cubes.filter((c) => c.storage === storageType);

  const grouped = CATEGORIES.map((cat) => {
    const catCubes = storageCubes.filter((c) => c.category === cat);
    const byKey = new Map<string, Cube[]>();
    for (const c of catCubes) {
      const key = `${c.name}__${c.expiryDate ?? ''}__${c.madeDate ?? ''}`;
      const list = byKey.get(key) ?? [];
      list.push(c);
      byKey.set(key, list);
    }
    const typeOrder: Record<string, number> = { blw: 0, cube: 1, portion: 2, raw: 3 };
    const groups = [...byKey.values()].sort((a, b) =>
      (typeOrder[a[0].itemType] ?? 9) - (typeOrder[b[0].itemType] ?? 9)
    );
    return { cat, groups };
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-gray-200 overflow-visible transition-colors ${className ?? ''} ${isOver ? 'ring-2 ring-blue-300' : ''}`}
    >
      <div className="border-b border-gray-200 bg-white px-3 py-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">{icon} {title}</h3>
        <button
          type="button"
          onClick={onAddCube}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-600"
          title="추가"
        >+</button>
      </div>
      <div className="p-2.5 space-y-2">
        {grouped.filter(({ groups }) => groups.length > 0).map(({ cat, groups }) => (
          <div key={cat}>
            <p className="mb-1 text-xs font-semibold text-gray-400">
              {CATEGORY_EMOJI[cat]} {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {groups.map((cubeGroup) => (
                <ItemCard
                  key={`${cubeGroup[0].name}__${cubeGroup[0].expiryDate ?? ''}__${cubeGroup[0].madeDate ?? ''}`} cubes={cubeGroup} selections={selections}
                  onAddToPlate={onAddToPlate}
                  onEdit={() => onEditCube(cubeGroup[0])}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IngredientShelf({ cubes, selections, onAddToPlate, onAddCube, onEditCube }: IngredientShelfProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StorageSection
        title="팬트리" icon={null} storageType="pantry"
        cubes={cubes} selections={selections} className="bg-blue-50/50"
        droppableId="shelf-pantry" onAddToPlate={onAddToPlate}
        onAddCube={() => onAddCube('pantry')} onEditCube={onEditCube}
      />
      <StorageSection
        title="냉동고" icon={null} storageType="freezer"
        cubes={cubes} selections={selections} className="bg-blue-50/50"
        droppableId="shelf" onAddToPlate={onAddToPlate}
        onAddCube={() => onAddCube('freezer')} onEditCube={onEditCube}
      />
      <StorageSection
        title="냉장고" icon={null} storageType="fridge"
        cubes={cubes} selections={selections} className="bg-blue-50/50"
        droppableId="shelf-fridge" onAddToPlate={onAddToPlate}
        onAddCube={() => onAddCube('fridge')} onEditCube={onEditCube}
      />
    </div>
  );
}
