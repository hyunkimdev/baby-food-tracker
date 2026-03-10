'use client';

import useSWR from 'swr';
import type { Meal } from '@/types';
import CubeBlock from './CubeBlock';
import { IconList, IconSunrise, IconSun, IconMoon } from './Icons';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const MEAL_ICON: Record<string, React.ReactNode> = {
  '아침': <IconSunrise />,
  '점심': <IconSun />,
  '저녁': <IconMoon />,
};

interface MealHistoryProps {
  onSelectMeal: (meal: Meal) => void;
  onDefrost: (meal: Meal) => void;
  selectedMealId?: string | null;
}

export default function MealHistory({ onSelectMeal, onDefrost, selectedMealId }: MealHistoryProps) {
  const { data: meals, isLoading } = useSWR<Meal[]>('/api/meals', fetcher);

  const byDate = new Map<string, Meal[]>();
  for (const meal of meals ?? []) {
    const list = byDate.get(meal.date) ?? [];
    list.push(meal);
    byDate.set(meal.date, list);
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 overflow-visible">
      <div className="border-b border-gray-200 bg-white px-3 py-1.5">
        <h3 className="text-xs font-bold text-gray-700"><IconList className="inline" /> 식단 기록</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
          </div>
        ) : sortedDates.length === 0 ? (
          <p className="py-8 text-center text-[10px] text-gray-400">기록이 없어요</p>
        ) : (
          sortedDates.map((date) => {
            const dayMeals = byDate.get(date)!;
            return (
              <div key={date} className="rounded-lg border border-gray-200 bg-white overflow-visible">
                <div className="px-2 py-1 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-600">{date}</span>
                </div>
                <div className="p-1.5 space-y-1">
                  {dayMeals.map((meal) => {
                    const isPlanned = meal.status === 'planned';
                    const isSelected = meal.id === selectedMealId;
                    return (
                      <div
                        key={meal.id}
                        className={`rounded-md px-2 py-1.5 cursor-pointer transition-colors border-2 ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-200'
                            : isPlanned
                              ? 'bg-blue-50/50 hover:bg-blue-50 border-dashed border-blue-200'
                              : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                        }`}
                        onClick={() => onSelectMeal(meal)}
                        title="클릭하여 수정"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-gray-500">
                            {MEAL_ICON[meal.mealType] ?? ''} {meal.mealType}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-600">{meal.totalWeight}g</span>
                            {isPlanned && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDefrost(meal);
                                }}
                                className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 active:bg-orange-300"
                              >
                                해동
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {meal.cubes.map((cube, i) => (
                            <div key={i} className="inline-flex items-center gap-1 rounded bg-white border border-gray-100 pl-1.5 pr-1 py-0.5">
                              <span className="text-[9px] text-gray-600">{cube.name}</span>
                              <div className="flex gap-[2px]">
                                {Array.from({ length: cube.quantity }).map((_, j) => (
                                  <CubeBlock
                                    key={j}
                                    color={cube.color}
                                    weight={cube.weight}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        {meal.memo && (
                          <p className="mt-1 text-[9px] text-gray-400">{meal.memo}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
