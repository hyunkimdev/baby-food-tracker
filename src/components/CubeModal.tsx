'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cube, CubeFormData, CubeCategory, ItemType, StorageType } from '@/types';
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants';
import { getCategoryColor } from './SettingsModal';
import CubeBlock from './CubeBlock';

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'cube', label: '큐브' },
  { value: 'portion', label: '소분' },
  { value: 'raw', label: '원재료' },
  { value: 'blw', label: '자기주도' },
];

interface CubeModalProps {
  cube?: Cube | null;
  cubeGroup?: Cube[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CubeFormData, id?: string) => void;
  onDelete?: (id: string) => void;
  defaultCategory?: CubeCategory;
  defaultStorage?: StorageType;
  portionSource?: Cube | null;
}

interface WeightSlot {
  id?: string;
  weight: string;
  quantity: string;
  expiryDate: string;
}

function autoFillYear(value: string): string {
  const v = value.trim();
  if (!v) return v;
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (m) {
    const y = new Date().getFullYear();
    return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  return v;
}

const SLOT_COUNT = 3;

function emptySlots(): WeightSlot[] {
  return Array.from({ length: SLOT_COUNT }, () => ({ weight: '', quantity: '', expiryDate: '' }));
}

export default function CubeModal({ cube, cubeGroup, isOpen, onClose, onSave, onDelete, defaultCategory, defaultStorage, portionSource }: CubeModalProps) {
  const isEdit = !!(cube || (cubeGroup && cubeGroup.length > 0));

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CubeCategory>('곡류');
  const [slots, setSlots] = useState<WeightSlot[]>(emptySlots());
  const [itemType, setItemType] = useState<ItemType>('cube');
  const [storage, setStorage] = useState<StorageType>('freezer');

  // Color is always derived from category (uses settings)
  const color = getCategoryColor(category);

  useEffect(() => {
    if (cubeGroup && cubeGroup.length > 0) {
      const first = cubeGroup[0];
      setName(first.name);
      setCategory(first.category);
      setItemType(first.itemType ?? 'cube');
      setStorage(first.storage ?? 'freezer');
      const filled: WeightSlot[] = cubeGroup.map((c) => ({
        id: c.id,
        weight: String(c.weight),
        quantity: String(c.quantity),
        expiryDate: c.expiryDate ?? '',
      }));
      while (filled.length < SLOT_COUNT) filled.push({ weight: '', quantity: '', expiryDate: '' });
      setSlots(filled.slice(0, Math.max(SLOT_COUNT, filled.length)));
    } else if (cube) {
      setName(cube.name);
      setCategory(cube.category);
      setItemType(cube.itemType ?? 'cube');
      setStorage(cube.storage ?? 'freezer');
      const filled: WeightSlot[] = [
        { id: cube.id, weight: String(cube.weight), quantity: String(cube.quantity), expiryDate: cube.expiryDate ?? '' },
      ];
      while (filled.length < SLOT_COUNT) filled.push({ weight: '', quantity: '', expiryDate: '' });
      setSlots(filled);
    } else if (portionSource) {
      // Pre-fill from portion source for conversion
      setName(portionSource.name);
      setCategory(portionSource.category);
      setItemType('cube');
      setStorage(defaultStorage ?? 'freezer');
      setSlots(emptySlots());
    } else {
      setName('');
      setCategory(defaultCategory ?? '곡류');
      setItemType('cube');
      setStorage(defaultStorage ?? 'freezer');
      setSlots(emptySlots());
    }
  }, [cube, cubeGroup, portionSource, isOpen]);

  const updateSlot = (index: number, patch: Partial<WeightSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const filled = slots.filter((s) => s.weight.trim() !== '' && Number(s.weight) > 0);

    if (isEdit) {
      for (const slot of filled) {
        onSave({
          name: name.trim(),
          category,
          color,
          weight: Number(slot.weight),
          quantity: Number(slot.quantity) || 0,
          minQuantity: 0,
          expiryDate: slot.expiryDate || null,
          madeDate: null,
          itemType,
          storage,
        }, slot.id);
      }
      if (onDelete) {
        for (const slot of slots) {
          if (slot.id && (!slot.weight.trim() || Number(slot.weight) <= 0)) {
            onDelete(slot.id);
          }
        }
      }
      onClose();
    } else {
      if (filled.length === 0) return;
      for (const slot of filled) {
        onSave({
          name: name.trim(),
          category,
          color,
          weight: Number(slot.weight),
          quantity: Number(slot.quantity) || 0,
          minQuantity: 0,
          expiryDate: slot.expiryDate || null,
          madeDate: null,
          itemType,
          storage,
        });
      }
      onClose();
    }
  };

  const handleDeleteAll = () => {
    if (!onDelete) return;
    const ids = slots.filter((s) => s.id).map((s) => s.id!);
    if (ids.length === 0) return;
    if (window.confirm(`"${name}" 큐브를 모두 삭제하시겠습니까?`)) {
      for (const id of ids) onDelete(id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div
              className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-5 py-3">
                <button type="button" onClick={onClose} className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100">취소</button>
                <h2 className="text-base font-bold">{portionSource ? '소분하기' : isEdit ? '재료 수정' : '재료 추가'}</h2>
                <button type="button" onClick={handleSave} disabled={!name.trim()} className="px-2 py-1 text-sm font-semibold text-blue-500 disabled:opacity-40 hover:text-blue-700 rounded hover:bg-blue-50">저장</button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">이름</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 쌀미음" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gray-200" style={{ backgroundColor: color }} title="카테고리 색상" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">종류</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ITEM_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setItemType(t.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg py-2 text-xs transition-colors ${
                          itemType === t.value
                            ? 'bg-blue-50 border-2 border-blue-500 font-semibold text-blue-700'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center h-5">
                          <CubeBlock color={color} weight={0} itemType={t.value} hideLabel />
                        </div>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">카테고리</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat as CubeCategory)} className={`flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors ${category === cat ? 'bg-blue-50 border-2 border-blue-500 font-semibold text-blue-700' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <span className="text-lg">{CATEGORY_EMOJI[cat]}</span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">무게 / 수량 / 사용기한</label>
                  <div className="space-y-2">
                    {slots.map((slot, i) => (
                      <div key={slot.id ?? `slot-${i}`} className="flex items-center gap-1.5">
                        <div className="w-16">
                          <input type="number" inputMode="numeric" value={slot.weight} onChange={(e) => updateSlot(i, { weight: e.target.value })} placeholder="g" min={1} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center" />
                        </div>
                        <span className="text-xs text-gray-400">g</span>
                        <span className="text-xs text-gray-300">×</span>
                        <div className="w-14">
                          <input type="number" inputMode="numeric" value={slot.quantity} onChange={(e) => updateSlot(i, { quantity: e.target.value })} placeholder="0" min={0} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center" />
                        </div>
                        <span className="text-xs text-gray-400">개</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={slot.expiryDate}
                            onChange={(e) => updateSlot(i, { expiryDate: e.target.value })}
                            onBlur={() => updateSlot(i, { expiryDate: autoFillYear(slot.expiryDate) })}
                            placeholder="기한 MM/DD"
                            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">빈 칸은 무시 · 기한은 연도 생략 시 올해 적용</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">보관 장소</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['pantry', '팬트리'], ['freezer', '냉동고'], ['fridge', '냉장고']] as [StorageType, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStorage(val)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                          storage === val
                            ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {isEdit && onDelete && slots.some((s) => s.id) && (
                  <button type="button" onClick={handleDeleteAll} className="w-full rounded-lg bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">큐브 삭제</button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
