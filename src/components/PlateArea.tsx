'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Cube, CombinationResult, MealType } from '@/types';
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants';
import CubeBlock from './CubeBlock';
import { IconPlate, IconSunrise, IconSun, IconMoon, IconWarning, IconThumbUp, IconCheck } from './Icons';

interface PlateAreaProps {
  selections: Record<string, number>;
  cubeMap: Map<string, Cube>;
  comboResults: CombinationResult[];
  comboLoading: boolean;
  memo: string;
  onMemoChange: (memo: string) => void;
  onRemoveOne: (id: string) => void;
  onSubmit: (date: string, mealType: MealType) => void;
  submitting: boolean;
  date: string;
  onDateChange: (date: string) => void;
  mealType: MealType;
  onMealTypeChange: (mt: MealType) => void;
  editingMealId?: string | null;
  onCancelEdit?: () => void;
}

const MEAL_TYPES: { value: MealType; label: string; icon: React.ReactNode }[] = [
  { value: '아침', label: '아침', icon: <IconSunrise /> },
  { value: '점심', label: '점심', icon: <IconSun /> },
  { value: '저녁', label: '저녁', icon: <IconMoon /> },
];

function DraggablePlateCube({ cube, index, onDoubleClick }: {
  cube: Cube & { usedQty: number }; index: number; onDoubleClick: () => void;
}) {
  const dragId = `plate__${cube.id}__${index}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { cube, source: 'plate' },
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
      onDoubleClick={onDoubleClick}
      className={`transition-opacity ${
        isDragging
          ? 'shadow-lg opacity-80 cursor-grabbing ring-1 ring-orange-400 rounded-[3px]'
          : 'cursor-grab hover:opacity-80'
      }`}
      title="더블클릭: 선반으로 되돌리기"
    >
      <CubeBlock color={cube.color} weight={cube.weight} />
    </div>
  );
}

export default function PlateArea({
  selections, cubeMap, comboResults, comboLoading,
  memo, onMemoChange, onRemoveOne, onSubmit, submitting,
  date, onDateChange, mealType, onMealTypeChange,
  editingMealId, onCancelEdit,
}: PlateAreaProps) {
  const { isOver, setNodeRef } = useDroppable({ id: 'plate' });

  const selectedCubes = Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const cube = cubeMap.get(id)!;
      return { ...cube, usedQty: qty };
    });

  const totalWeight = selectedCubes.reduce((s, c) => s + c.weight * c.usedQty, 0);
  const badCombos = comboResults.filter((r) => r.type === 'bad');
  const goodCombos = comboResults.filter((r) => r.type === 'good');

  // Group by category, then by name within each category
  const grouped = CATEGORIES.map((cat) => {
    const catItems = selectedCubes.filter((c) => c.category === cat);
    const byName = new Map<string, typeof catItems>();
    for (const c of catItems) {
      const list = byName.get(c.name) ?? [];
      list.push(c);
      byName.set(c.name, list);
    }
    return { cat, nameGroups: [...byName.values()] };
  });

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 overflow-visible bg-orange-50/50">
      {/* Header: date + meal type */}
      <div className="border-b border-gray-200 bg-white px-3 py-1.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-700"><IconPlate /></span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="text-xs border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-700 focus:border-blue-400 focus:outline-none"
        />
        <div className="flex gap-0.5">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => onMealTypeChange(mt.value)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                mealType === mt.value
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'text-gray-500 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {mt.icon} {mt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 transition-colors ${isOver ? 'bg-orange-100/60' : ''}`}
        style={{ minHeight: 120 }}
      >
        <div className="space-y-1.5">
          {grouped.map(({ cat, nameGroups }) => (
            <div key={cat}>
              <p className="mb-1 text-[10px] font-semibold text-gray-400">
                {CATEGORY_EMOJI[cat]} {cat}
              </p>
              {nameGroups.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {nameGroups.map((group) => (
                    <div
                      key={group[0].name}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white pl-2 pr-1.5 py-1 shadow-sm"
                    >
                      <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{group[0].name}</span>
                      <div className="flex flex-col gap-[3px]">
                        {group.map((c) => (
                          <div key={c.id} className="flex flex-wrap gap-[3px] items-end">
                            {Array.from({ length: c.usedQty }).map((_, i) => (
                              <DraggablePlateCube
                                key={i} cube={c} index={i}
                                onDoubleClick={() => onRemoveOne(c.id)}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-md border border-dashed py-1 text-center text-[10px] ${
                  isOver ? 'border-blue-300 text-blue-400' : 'border-gray-200 text-gray-300'
                }`}>—</div>
              )}
            </div>
          ))}

          {comboLoading && (
            <div className="flex items-center gap-2 py-1 text-[10px] text-gray-500">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
              궁합 확인 중...
            </div>
          )}
          {badCombos.map((r, i) => (
            <div key={`bad-${i}`} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px]">
              <span className="font-bold text-red-600"><IconWarning className="inline" /> {r.ingredients[0]} + {r.ingredients[1]}</span>
              <p className="text-red-500">{r.message}</p>
            </div>
          ))}
          {goodCombos.map((r, i) => (
            <div key={`good-${i}`} className="rounded-lg border border-green-200 bg-green-50 px-2 py-1.5 text-[10px]">
              <span className="font-bold text-green-600"><IconThumbUp className="inline" /> {r.ingredients[0]} + {r.ingredients[1]}</span>
              <p className="text-green-500">{r.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white px-3 py-2 space-y-2">
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="메모 (선택)"
          rows={1}
          className="w-full rounded-lg border border-gray-200 p-1.5 text-xs text-gray-900 placeholder-gray-300 focus:border-blue-400 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            총 <span className="font-bold text-gray-900">{totalWeight}g</span>
          </span>
          <div className="flex items-center gap-2">
            {editingMealId && onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100"
              >
                취소
              </button>
            )}
            <button
              type="button"
              onClick={() => onSubmit(date, mealType)}
              disabled={selectedCubes.length === 0 || submitting}
              className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400"
            >
              {submitting ? '저장 중...' : <><IconCheck className="inline" /> 저장</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
