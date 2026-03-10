'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import type { MealType } from '@/types';

const SETTINGS_KEY = 'baby-food-tracker-settings';
const DEFAULT_MIN_QUANTITY = 2;
const DEFAULT_EXPIRY_WARN_DAYS = 3;
const ALL_MEAL_TYPES: MealType[] = ['아침', '점심', '저녁'];

interface Settings {
  minQuantity: number;
  hiddenMealTypes: MealType[];
  expiryWarnDays: number;
}

function getSettings(): Settings {
  if (typeof window === 'undefined') return { minQuantity: DEFAULT_MIN_QUANTITY, hiddenMealTypes: [], expiryWarnDays: DEFAULT_EXPIRY_WARN_DAYS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        minQuantity: parsed.minQuantity ?? DEFAULT_MIN_QUANTITY,
        hiddenMealTypes: parsed.hiddenMealTypes ?? [],
        expiryWarnDays: parsed.expiryWarnDays ?? DEFAULT_EXPIRY_WARN_DAYS,
      };
    }
  } catch {}
  return { minQuantity: DEFAULT_MIN_QUANTITY, hiddenMealTypes: [], expiryWarnDays: DEFAULT_EXPIRY_WARN_DAYS };
}

export function getMinQuantity(): number {
  return getSettings().minQuantity;
}

export function getHiddenMealTypes(): MealType[] {
  return getSettings().hiddenMealTypes;
}

export function getExpiryWarnDays(): number {
  return getSettings().expiryWarnDays;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [minQuantity, setMinQuantity] = useState(DEFAULT_MIN_QUANTITY);
  const [hiddenMealTypes, setHiddenMealTypes] = useState<MealType[]>([]);
  const [expiryWarnDays, setExpiryWarnDays] = useState(DEFAULT_EXPIRY_WARN_DAYS);

  useEffect(() => {
    if (isOpen) {
      const s = getSettings();
      setMinQuantity(s.minQuantity);
      setHiddenMealTypes(s.hiddenMealTypes);
      setExpiryWarnDays(s.expiryWarnDays);
    }
  }, [isOpen]);

  const toggleMealType = (mt: MealType) => {
    setHiddenMealTypes(prev =>
      prev.includes(mt) ? prev.filter(m => m !== mt) : [...prev, mt]
    );
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ minQuantity, hiddenMealTypes, expiryWarnDays }));
    onClose();
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
              className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                >
                  취소
                </button>
                <h2 className="text-base font-bold">설정</h2>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-2 py-1 text-sm font-semibold text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50"
                >
                  저장
                </button>
              </div>
              <div className="px-5 py-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    식단 표시
                  </label>
                  <p className="mb-2 text-xs text-gray-400">
                    주간 식단에서 보이는 끼니를 선택합니다.
                  </p>
                  <div className="flex gap-2">
                    {ALL_MEAL_TYPES.map(mt => {
                      const visible = !hiddenMealTypes.includes(mt);
                      return (
                        <button
                          key={mt}
                          type="button"
                          onClick={() => toggleMealType(mt)}
                          className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                            visible
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                          }`}
                        >
                          {mt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    최소 수량 (알림 기준)
                  </label>
                  <p className="mb-2 text-xs text-gray-400">
                    재고가 이 수량 이하이면 부족 표시됩니다.
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    사용기한 임박 알림 (일)
                  </label>
                  <p className="mb-2 text-xs text-gray-400">
                    사용기한이 이 일수 이내이면 경고 표시됩니다.
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={expiryWarnDays}
                    onChange={(e) => setExpiryWarnDays(Number(e.target.value) || 0)}
                    min={0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
