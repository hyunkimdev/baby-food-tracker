'use client';

import { useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useDraggable, useDroppable, useDndMonitor } from '@dnd-kit/core';
import type { Cube, CombinationResult, MealType, Meal, CubeCategory, ItemType } from '@/types';
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants';
import CubeBlock from './CubeBlock';
import CubeChip from './CubeChip';
import { IconWarning, IconThumbUp } from './Icons';

const MEAL_TYPES: MealType[] = ['아침', '점심', '저녁'];

function DraggableCube({ cubeId, color, weight, index, onDoubleClick, itemType }: {
  cubeId: string; color: string; weight: number; index: number; onDoubleClick: () => void; itemType?: ItemType;
}) {
  const dragId = `plate__${cubeId}__${index}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { cube: { id: cubeId, color, weight }, source: 'plate' },
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
      title="더블클릭: 제거"
    >
      <CubeBlock color={color} weight={weight} itemType={itemType} />
    </div>
  );
}

function DroppableCell({ id, children, onClick, className, style }: {
  id: string; children: React.ReactNode; onClick: () => void;
  className: string; style?: React.CSSProperties;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <td ref={setNodeRef} onClick={onClick} className={className} style={style}>
      {children}
    </td>
  );
}

function getWeekDates(baseDate: string): string[] {
  // Returns 7 consecutive days starting from (baseDate - 6) to baseDate
  // so baseDate is the last day shown, giving a trailing 7-day window
  const d = new Date(baseDate + 'T00:00:00');
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
  });
}

function get7Days(startDate: string): string[] {
  const d = new Date(startDate + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
  });
}

function formatDay(dateStr: string): { display: string; isToday: boolean; isSun: boolean; isSat: boolean } {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  return {
    display: `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`,
    isToday: d.toDateString() === today.toDateString(),
    isSun: d.getDay() === 0,
    isSat: d.getDay() === 6,
  };
}

interface WeeklyTableProps {
  meals: Meal[];
  selections: Record<string, number>;
  cubeMap: Map<string, Cube>;
  activeDate: string;
  activeMealType: MealType;
  hiddenMealTypes: MealType[];
  onCellSelect: (date: string, mealType: MealType) => void;
  onRemoveOne: (id: string) => void;
  onDefrost: (meal: Meal) => void;
  onUnlock: (meal: Meal) => void;
  comboResults: CombinationResult[];
  comboLoading: boolean;
}

export interface WeeklyTableHandle {
  shiftView: (days: number) => void;
  goToday: () => void;
}

const WeeklyTable = forwardRef<WeeklyTableHandle, WeeklyTableProps>(function WeeklyTable({
  meals, selections, cubeMap, activeDate, activeMealType, hiddenMealTypes,
  onCellSelect, onRemoveOne, onDefrost, onUnlock, comboResults, comboLoading,
}, ref) {
  const visibleMealTypes = MEAL_TYPES.filter(mt => !hiddenMealTypes.includes(mt));

  // viewStart is the first day shown in the 7-day window (always a Monday)
  const initialMonday = getWeekDates(activeDate)[0];
  const [viewStart, setViewStart] = useState(initialMonday);
  // Track previous activeDate to detect external changes (cell select, drag)
  const [prevActiveDate, setPrevActiveDate] = useState(activeDate);
  if (activeDate !== prevActiveDate) {
    setPrevActiveDate(activeDate);
    const visible = get7Days(viewStart);
    if (!visible.includes(activeDate)) {
      setViewStart(getWeekDates(activeDate)[0]);
    }
  }
  const weekDates = get7Days(viewStart);

  // Track which (date, mealType) slot is being hovered during drag
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  useDndMonitor({
    onDragOver(event) {
      const overId = event.over?.id as string | undefined;
      if (overId?.startsWith('plate__')) {
        const parts = overId.split('__');
        setHoverSlot(`${parts[1]}__${parts[2]}`);
      } else {
        setHoverSlot(null);
      }
    },
    onDragEnd() { setHoverSlot(null); },
    onDragCancel() { setHoverSlot(null); },
  });

  // Meal lookup
  const mealLookup = useMemo(() => {
    const map = new Map<string, Meal>();
    for (const meal of meals) {
      map.set(`${meal.date}__${meal.mealType}`, meal);
    }
    return map;
  }, [meals]);

  // Group editing selections by category
  const editingByCategory = new Map<CubeCategory, { name: string; color: string; cubeId: string; weight: number; qty: number; itemType: ItemType }[]>();
  for (const [id, qty] of Object.entries(selections)) {
    if (qty <= 0) continue;
    const cube = cubeMap.get(id);
    if (!cube) continue;
    const list = editingByCategory.get(cube.category) ?? [];
    list.push({ name: cube.name, color: cube.color, cubeId: id, weight: cube.weight, qty, itemType: cube.itemType });
    editingByCategory.set(cube.category, list);
  }

  const badCombos = comboResults.filter(r => r.type === 'bad');
  const goodCombos = comboResults.filter(r => r.type === 'good');

  function shiftView(days: number) {
    const d = new Date(viewStart + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setViewStart(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  function goToday() {
    const t = new Date();
    const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    setViewStart(getWeekDates(todayStr)[0]);
  }

  useImperativeHandle(ref, () => ({ shiftView, goToday }));

  function renderCellContent(date: string, mealType: MealType, category: CubeCategory) {
    const meal = mealLookup.get(`${date}__${mealType}`);
    // Don't treat cell as active if meal is already used (locked)
    const isActive = date === activeDate && mealType === activeMealType && meal?.status !== 'used';

    if (isActive) {
      const items = editingByCategory.get(category) ?? [];
      if (items.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1 items-center py-0.5">
          {items.map(item => (
            <CubeChip key={item.cubeId} name={item.name}>
              {Array.from({ length: item.qty }).map((_, i) => (
                <DraggableCube
                  key={i}
                  cubeId={item.cubeId}
                  color={item.color}
                  weight={item.weight}
                  index={i}
                  onDoubleClick={() => onRemoveOne(item.cubeId)}
                  itemType={item.itemType}
                />
              ))}
            </CubeChip>
          ))}
        </div>
      );
    }

    // Show saved meal
    if (!meal) return null;

    const isUsed = meal.status === 'used';

    const categoryCubes = meal.cubes.filter(cu => {
      // Prefer live cube data for category (handles category changes in pantry/freezer/fridge)
      if (cu.cubeId) {
        const liveCube = cubeMap.get(cu.cubeId);
        if (liveCube) return liveCube.category === category;
      }
      if (cu.category) return cu.category === category;
      return false;
    });

    if (categoryCubes.length === 0) return null;
    return (
      <div className={`flex flex-wrap gap-1 items-center py-0.5 ${isUsed ? 'opacity-50' : ''}`}>
        {categoryCubes.map((cu, i) => {
          // Use live cube data for color (handles color updates)
          const liveCube = cu.cubeId ? cubeMap.get(cu.cubeId) : null;
          return (
            <CubeChip key={i} name={cu.name}>
              {Array.from({ length: cu.quantity }).map((_, j) => (
                <CubeBlock key={j} color={liveCube?.color ?? cu.color} weight={cu.weight} itemType={liveCube?.itemType ?? cu.itemType} />
              ))}
            </CubeChip>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-auto bg-white">
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: 48 }} />
            {weekDates.map(date => [
              <col key={`${date}-e`} style={{ width: 28 }} />,
              <col key={date} />,
            ])}
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b border-r border-gray-200 px-1 py-1 text-center text-[10px] font-semibold text-gray-400" />
              {weekDates.map(date => {
                const { display, isToday, isSun, isSat } = formatDay(date);
                return (
                  <th
                    key={date}
                    colSpan={2}
                    className={`border-b border-r border-gray-200 px-1 py-1 text-center text-[11px] font-semibold ${
                      isToday ? 'bg-blue-50 text-blue-700' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {display}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleMealTypes.map((mt, mtIdx) => {
              const catRows = CATEGORIES.map((cat, catIdx) => (
                <tr key={`${mt}-${cat}`} className={mtIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  {catIdx === 0 && (
                    <td
                      rowSpan={7}
                      className="border-b-2 border-r border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 align-middle text-center whitespace-nowrap"
                    >
                      {mt}
                    </td>
                  )}
                  {weekDates.map(date => {
                    const meal = mealLookup.get(`${date}__${mt}`);
                    const isFocused = date === activeDate && mt === activeMealType;
                    const isEditing = isFocused && meal?.status !== 'used';
                    const isHovered = hoverSlot === `${date}__${mt}`;
                    const isPlanned = meal?.status === 'planned' && !isEditing;
                    const content = renderCellContent(date, mt, cat);
                    const isFirst = catIdx === 0;
                    const cellHighlight = isHovered
                      ? `bg-orange-50/40 ${isFirst ? 'border-t-2 border-t-orange-300' : ''}`
                      : isFocused
                        ? `bg-orange-50/30 ${isFirst ? 'border-t-2 border-t-orange-300' : ''}`
                        : 'hover:bg-gray-50';
                    const plannedBg = isPlanned && !isHovered && !isFocused ? 'bg-blue-50/20' : '';
                    const leftHL = (isFocused || isHovered) ? 'border-l-2 border-l-orange-300' : '';
                    const rightHL = (isFocused || isHovered) ? 'border-r-2 border-r-orange-300' : '';
                    return [
                      <td
                        key={`${date}-emoji`}
                        onClick={() => onCellSelect(date, mt)}
                        className={`border-r border-gray-100 px-1 text-center text-sm cursor-pointer border-b ${cellHighlight} ${plannedBg} ${leftHL}`}
                        style={{ height: 26, width: 28 }}
                      >
                        {CATEGORY_EMOJI[cat]}
                      </td>,
                      <DroppableCell
                        key={date}
                        id={`plate__${date}__${mt}__${catIdx}`}
                        onClick={() => onCellSelect(date, mt)}
                        className={`border-r border-gray-200 px-1.5 cursor-pointer transition-colors align-middle border-b ${cellHighlight} ${plannedBg} ${rightHL}`}
                        style={{ height: 26 }}
                      >
                        {content}
                      </DroppableCell>,
                    ];
                  })}
                </tr>
              ));

              // Summary row with total weight + 사용 button
              const summaryRow = (
                <tr key={`${mt}-summary`} className={mtIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  {weekDates.map(date => {
                    const meal = mealLookup.get(`${date}__${mt}`);
                    const isFocused = date === activeDate && mt === activeMealType;
                    const isEditing = isFocused && meal?.status !== 'used';
                    const isHovered = hoverSlot === `${date}__${mt}`;

                    // Compute total weight: use selections for editing cell, otherwise use saved meal
                    let totalWeight = 0;
                    if (isEditing) {
                      totalWeight = Object.entries(selections).reduce((sum, [id, qty]) => {
                        if (qty <= 0) return sum;
                        const cube = cubeMap.get(id);
                        return sum + (cube ? cube.weight * qty : 0);
                      }, 0);
                    } else if (meal) {
                      totalWeight = meal.totalWeight;
                    }

                    const hasCubes = isEditing
                      ? Object.values(selections).some(q => q > 0)
                      : (meal != null && meal.cubes.length > 0 && meal.totalWeight > 0);
                    const isPlanned = meal?.status === 'planned';
                    const isUsed = meal?.status === 'used';
                    const cellHighlight = isHovered
                      ? 'bg-orange-50/40 border-b-2 border-b-orange-300'
                      : isFocused
                        ? 'bg-orange-50/30 border-b-2 border-b-orange-300'
                        : 'hover:bg-gray-50';
                    const leftHL = (isFocused || isHovered) ? 'border-l-2 border-l-orange-300' : '';
                    const rightHL = (isFocused || isHovered) ? 'border-r-2 border-r-orange-300' : '';

                    return (
                      <td
                        key={date}
                        colSpan={2}
                        className={`border-r border-gray-200 border-b-2 px-1 py-0 text-center ${cellHighlight} ${leftHL} ${rightHL}`}
                        style={{ height: 22 }}
                      >
                        {hasCubes && (
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-[11px] font-bold ${isUsed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {totalWeight}g
                            </span>
                            {isPlanned && meal && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDefrost(meal); }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
                              >
                                사용
                              </button>
                            )}
                            {isUsed && meal && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onUnlock(meal); }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                              >
                                사용해제
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );

              return [...catRows, summaryRow];
            })}
          </tbody>
        </table>
      </div>

      {/* Combo results */}
      {(comboLoading || badCombos.length > 0 || goodCombos.length > 0) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-1">
          {comboLoading && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
            </div>
          )}
          {badCombos.map((r, i) => (
            <span key={`bad-${i}`} className="text-xs text-red-600 font-bold whitespace-nowrap">
              <IconWarning className="inline" /> {r.ingredients[0]}+{r.ingredients[1]}: {r.message}
            </span>
          ))}
          {goodCombos.map((r, i) => (
            <span key={`good-${i}`} className="text-xs text-green-600 font-bold whitespace-nowrap">
              <IconThumbUp className="inline" /> {r.ingredients[0]}+{r.ingredients[1]}: {r.message}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default WeeklyTable;
