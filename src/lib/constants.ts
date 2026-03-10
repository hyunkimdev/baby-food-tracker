import { CubeCategory } from '@/types';

export const COLOR_PALETTE = [
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800',
  '#FF5722', '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688',
  '#795548', '#607D8B', '#78909C', '#A1887F', '#FFAB91',
];

export const CATEGORIES: CubeCategory[] = ['곡류', '단백질', '잎채소', '노란채소', '과일', '유제품'];

export const CATEGORY_EMOJI: Record<CubeCategory, string> = {
  '곡류': '🌾',
  '단백질': '🥩',
  '잎채소': '🥬',
  '노란채소': '🥕',
  '과일': '🍎',
  '유제품': '🥛',
};

export const CATEGORY_COLORS: Record<CubeCategory, string> = {
  '곡류': '#F59E0B',
  '단백질': '#EF4444',
  '잎채소': '#10B981',
  '노란채소': '#F97316',
  '과일': '#EC4899',
  '유제품': '#3B82F6',
};
