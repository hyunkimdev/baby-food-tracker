export type ItemType = 'cube' | 'portion' | 'raw' | 'blw';

export type StorageType = 'pantry' | 'freezer' | 'fridge';

export interface Cube {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  color: string;
  category: CubeCategory;
  storage: StorageType;
  minQuantity: number;
  expiryDate?: string | null;
  madeDate?: string | null;
  itemType: ItemType;
}

export type CubeCategory = '곡류' | '단백질' | '잎채소' | '노란채소' | '과일' | '유제품';

export interface CubeUsage {
  cubeId: string;
  name: string;
  weight: number;
  quantity: number;
  color: string;
  category?: CubeCategory;
  itemType?: ItemType;
}

export type MealType = '아침' | '점심' | '저녁';

export type MealStatus = 'planned' | 'used';

export interface Meal {
  id: string;
  date: string;
  mealType: MealType;
  cubes: CubeUsage[];
  totalWeight: number;
  memo: string;
  status: MealStatus;
}

export interface CombinationResult {
  type: 'bad' | 'good' | 'neutral';
  message: string;
  ingredients: [string, string];
}

export interface CubeFormData {
  name: string;
  weight: number;
  quantity: number;
  color: string;
  category: CubeCategory;
  storage: StorageType;
  minQuantity: number;
  expiryDate?: string | null;
  madeDate?: string | null;
  itemType: ItemType;
}
