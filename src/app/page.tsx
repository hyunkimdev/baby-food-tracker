'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import type { Cube, CubeFormData, CombinationResult, MealType, Meal, StorageType } from '@/types';
import IngredientShelf from '@/components/IngredientShelf';
import WeeklyTable from '@/components/WeeklyTable';
import CubeModal from '@/components/CubeModal';
import SettingsModal, { getHiddenMealTypes } from '@/components/SettingsModal';
import { IconSettings } from '@/components/Icons';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return '아침';
  if (h < 16) return '점심';
  return '저녁';
}

export default function HomePage() {
  const { data: cubes, mutate: mutateCubes } = useSWR<Cube[]>('/api/cubes', fetcher);
  const { data: meals, mutate: mutateMeals } = useSWR<Meal[]>('/api/meals', fetcher);

  const [selections, setSelections] = useState<Record<string, number>>({});
  const [comboResults, setComboResults] = useState<CombinationResult[]>([]);
  const [comboLoading, setComboLoading] = useState(false);
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(todayStr);
  const [mealType, setMealType] = useState<MealType>(currentMealType);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCube, setSelectedCube] = useState<Cube | null>(null);
  const [selectedCubeGroup, setSelectedCubeGroup] = useState<Cube[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<Cube['category']>('곡류');
  const [defaultStorage, setDefaultStorage] = useState<StorageType>('freezer');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hiddenMealTypes, setHiddenMealTypes] = useState<MealType[]>([]);

  const editingMealIdRef = useRef<string | null>(null);
  editingMealIdRef.current = editingMealId;

  // Use refs for values needed in autoSave to avoid stale closures
  const dateRef = useRef(date);
  dateRef.current = date;
  const mealTypeRef = useRef(mealType);
  mealTypeRef.current = mealType;
  const memoRef = useRef(memo);
  memoRef.current = memo;
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;

  useEffect(() => {
    setHiddenMealTypes(getHiddenMealTypes());
  }, [settingsOpen]);

  const cubeMap = new Map(cubes?.map((c) => [c.id, c]) ?? []);
  const cubeMapRef = useRef(cubeMap);
  cubeMapRef.current = cubeMap;

  const selectedNames = Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([id]) => cubeMap.get(id)?.name)
    .filter(Boolean) as string[];

  useEffect(() => {
    if (selectedNames.length < 2) {
      setComboResults([]);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ ingredients: selectedNames.join(',') });
    setComboLoading(true);
    fetch(`/api/combinations/check?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: CombinationResult[]) => { setComboResults(data); setComboLoading(false); })
      .catch((err) => { if (err.name !== 'AbortError') setComboLoading(false); });
    return () => controller.abort();
  }, [selectedNames.join(',')]);

  // --- Auto-save with optimistic SWR update ---
  const autoSave = useCallback(async (
    newSelections: Record<string, number>,
    saveDate: string,
    saveMealType: MealType,
    saveMemo: string,
    mealId: string | null,
  ): Promise<string | null> => {
    const cubeEntries = Object.entries(newSelections).filter(([, qty]) => qty > 0);

    const selectedCubes = cubeEntries.map(([id, qty]) => {
      const cube = cubeMapRef.current.get(id)!;
      return { cubeId: id, name: cube.name, weight: cube.weight, quantity: qty, color: cube.color, category: cube.category, itemType: cube.itemType };
    });
    const totalWeight = selectedCubes.reduce((s, c) => s + c.weight * c.quantity, 0);

    // Optimistically update SWR cache immediately
    const optimisticMeal: Meal = {
      id: mealId ?? `temp-${Date.now()}`,
      date: saveDate,
      mealType: saveMealType,
      cubes: selectedCubes,
      totalWeight,
      memo: saveMemo,
      status: 'planned',
    };

    mutateMeals((current) => {
      if (!current) return [optimisticMeal];
      if (mealId) {
        // Update existing
        const exists = current.some(m => m.id === mealId);
        if (exists) {
          if (cubeEntries.length === 0) {
            return current.filter(m => m.id !== mealId);
          }
          return current.map(m => m.id === mealId ? optimisticMeal : m);
        }
      }
      if (cubeEntries.length === 0) return current;
      return [...current, optimisticMeal];
    }, false); // false = don't revalidate yet

    if (cubeEntries.length === 0) {
      // No cubes left — delete the meal if it exists
      if (mealId) {
        try {
          await fetch('/api/meals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: mealId, cubes: [], memo: saveMemo, date: saveDate, mealType: saveMealType }),
          });
        } catch {}
        mutateMeals(); // revalidate
      }
      return null;
    }

    try {
      if (mealId) {
        await fetch('/api/meals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: mealId, cubes: selectedCubes, memo: saveMemo, date: saveDate, mealType: saveMealType }),
        });
        mutateMeals();
        return mealId;
      } else {
        const res = await fetch('/api/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cubes: selectedCubes, memo: saveMemo, date: saveDate, mealType: saveMealType }),
        });
        const meal = await res.json();
        mutateMeals();
        return meal.id as string;
      }
    } catch {
      mutateMeals(); // revalidate to fix any optimistic mismatch
      return mealId;
    }
  }, [mutateMeals]);

  // --- Cube CRUD ---
  const handleAddCube = (storage: StorageType) => {
    setSelectedCube(null);
    setSelectedCubeGroup([]);
    setDefaultStorage(storage);
    setDefaultCategory('곡류');
    setModalOpen(true);
  };

  const handleEditCube = (cube: Cube) => {
    const group = (cubes ?? []).filter((c) => c.name === cube.name && c.category === cube.category && (c.expiryDate ?? '') === (cube.expiryDate ?? '') && (c.madeDate ?? '') === (cube.madeDate ?? ''));
    setSelectedCube(cube);
    setSelectedCubeGroup(group);
    setModalOpen(true);
  };

  const handleSaveCube = async (data: CubeFormData, id?: string) => {
    if (id) {
      await fetch(`/api/cubes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/cubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    mutateCubes();
  };

  const handleDeleteCube = async (id: string) => {
    await fetch(`/api/cubes/${id}`, { method: 'DELETE' });
    mutateCubes();
  };

  // --- Plate interactions with auto-save (no side effects in state updaters) ---
  const addToPlateAndSave = useCallback((id: string) => {
    const cube = cubeMapRef.current.get(id);
    if (!cube) return;
    if (cube.itemType !== 'cube' && cube.itemType !== 'blw') return;
    const prev = selectionsRef.current;
    const current = prev[id] ?? 0;
    if (current >= cube.quantity) return;
    const newSel = { ...prev, [id]: current + 1 };
    setSelections(newSel);
    autoSave(newSel, dateRef.current, mealTypeRef.current, memoRef.current, editingMealIdRef.current).then(resultId => {
      if (resultId && resultId !== editingMealIdRef.current) {
        setEditingMealId(resultId);
      }
    });
  }, [autoSave]);

  const removeOneAndSave = useCallback((id: string) => {
    const prev = selectionsRef.current;
    const current = prev[id] ?? 0;
    if (current <= 0) return;
    let newSel: Record<string, number>;
    if (current <= 1) {
      const { [id]: _, ...rest } = prev;
      newSel = rest;
    } else {
      newSel = { ...prev, [id]: current - 1 };
    }
    setSelections(newSel);
    autoSave(newSel, dateRef.current, mealTypeRef.current, memoRef.current, editingMealIdRef.current).then(resultId => {
      if (resultId === null && editingMealIdRef.current) {
        // All cubes removed, meal deleted
        setEditingMealId(null);
      }
    });
  }, [autoSave]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active.data.current) return;
    const { cube, source } = active.data.current as { cube: Cube; source: 'shelf' | 'plate' };
    const target = over.id as string;

    if (source === 'shelf' && target.startsWith('plate__')) {
      const parts = target.split('__');
      const dropDate = parts[1];
      const dropMealType = parts[2] as MealType;

      if (dropDate !== dateRef.current || dropMealType !== mealTypeRef.current) {
        // Switch to target slot
        const existingMeal = (meals ?? []).find(m => m.date === dropDate && m.mealType === dropMealType);
        let newSelections: Record<string, number>;
        let newMealId: string | null;
        let newMemo: string;

        if (existingMeal) {
          newMealId = existingMeal.id;
          newMemo = existingMeal.memo;
          newSelections = {};
          for (const c of existingMeal.cubes) {
            if (c.cubeId) newSelections[c.cubeId] = c.quantity;
          }
          newSelections[cube.id] = (newSelections[cube.id] ?? 0) + 1;
        } else {
          newMealId = null;
          newMemo = '';
          newSelections = { [cube.id]: 1 };
        }

        setSelections(newSelections);
        setDate(dropDate);
        setMealType(dropMealType);
        setMemo(newMemo);
        setEditingMealId(newMealId);
        setComboResults([]);

        autoSave(newSelections, dropDate, dropMealType, newMemo, newMealId).then(resultId => {
          if (resultId && resultId !== newMealId) setEditingMealId(resultId);
        });
      } else {
        addToPlateAndSave(cube.id);
      }
    }

    if (source === 'plate' && (target === 'shelf' || target === 'shelf-fridge' || target === 'shelf-pantry')) {
      removeOneAndSave(cube.id);
    }
  }, [addToPlateAndSave, removeOneAndSave, meals, autoSave]);

  const handleCellSelect = useCallback((cellDate: string, cellMealType: MealType) => {
    // If clicking the already active cell, do nothing
    if (cellDate === dateRef.current && cellMealType === mealTypeRef.current) return;

    const existingMeal = (meals ?? []).find(m => m.date === cellDate && m.mealType === cellMealType);
    if (existingMeal) {
      setEditingMealId(existingMeal.id);
      setDate(existingMeal.date);
      setMealType(existingMeal.mealType);
      setMemo(existingMeal.memo);
      const newSelections: Record<string, number> = {};
      for (const cube of existingMeal.cubes) {
        if (cube.cubeId) newSelections[cube.cubeId] = cube.quantity;
      }
      setSelections(newSelections);
      setComboResults([]);
    } else {
      setEditingMealId(null);
      setSelections({});
      setMemo('');
      setComboResults([]);
      setDate(cellDate);
      setMealType(cellMealType);
    }
  }, [meals]);

  const handleDefrost = useCallback(async (meal: Meal) => {
    try {
      const res = await fetch('/api/meals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'defrost', id: meal.id, cubes: meal.cubes }),
      });
      if (!res.ok) throw new Error('Failed');
      mutateCubes();
      mutateMeals();
    } catch {
      alert('해동에 실패했어요. 다시 시도해주세요.');
    }
  }, [mutateCubes, mutateMeals]);

  const handleCancelEdit = useCallback(() => {
    setEditingMealId(null);
    setSelections({});
    setMemo('');
    setComboResults([]);
    setDate(todayStr());
    setMealType(currentMealType());
  }, []);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="mx-auto max-w-[1600px] px-6 py-5 space-y-5">
        <WeeklyTable
          settingsButton={
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="설정"
            >
              <IconSettings />
            </button>
          }
          meals={meals ?? []}
          selections={selections}
          cubeMap={cubeMap}
          activeDate={date}
          activeMealType={mealType}
          hiddenMealTypes={hiddenMealTypes}
          onCellSelect={handleCellSelect}
          onRemoveOne={removeOneAndSave}
          onDefrost={handleDefrost}
          comboResults={comboResults}
          comboLoading={comboLoading}
        />

        <IngredientShelf
          cubes={cubes ?? []}
          selections={selections}
          onAddToPlate={addToPlateAndSave}
          onAddCube={handleAddCube}
          onEditCube={handleEditCube}
        />
      </div>

      <CubeModal
        cube={selectedCube}
        cubeGroup={selectedCubeGroup}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCube(null); setSelectedCubeGroup([]); }}
        onSave={handleSaveCube}
        onDelete={handleDeleteCube}
        defaultCategory={defaultCategory}
        defaultStorage={defaultStorage}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </DndContext>
  );
}
