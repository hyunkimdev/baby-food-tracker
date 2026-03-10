import { getSupabase } from './supabase';
import { Meal, MealType, MealStatus, CubeUsage } from '@/types';

// Memo encoding: "[status:used][meal:점심]actual memo"
// meal_time column is timestamp, so we store mealType in memo prefix

interface MealRow {
  id: string;
  date: string;
  meal_time: string;
  cubes: CubeUsage[];
  total_weight: number;
  memo: string;
}

const MEAL_TYPE_RE = /^\[meal:([^\]]+)\]/;
const STATUS_RE = /^\[status:([^\]]+)\]/;

function parseMemo(raw: string): { status: MealStatus; mealType: MealType; cleanMemo: string } {
  let s = raw ?? '';
  let status: MealStatus = 'planned';
  let mealType: MealType = '아침';

  const statusMatch = s.match(STATUS_RE);
  if (statusMatch) {
    status = statusMatch[1] as MealStatus;
    s = s.slice(statusMatch[0].length);
  }

  const mealMatch = s.match(MEAL_TYPE_RE);
  if (mealMatch) {
    mealType = mealMatch[1] as MealType;
    s = s.slice(mealMatch[0].length);
  }

  return { status, mealType, cleanMemo: s };
}

function encodeMemo(memo: string, status: MealStatus, mealType: MealType): string {
  return `[status:${status}][meal:${mealType}]${memo}`;
}

function mealTimeForDate(date: string): string {
  // Use noon of the given date as a valid timestamp
  return `${date}T12:00:00`;
}

function rowToMeal(row: MealRow): Meal {
  const { status, mealType, cleanMemo } = parseMemo(row.memo ?? '');
  const cubes = typeof row.cubes === 'string' ? JSON.parse(row.cubes) : (row.cubes ?? []);
  return {
    id: row.id,
    date: row.date,
    mealType,
    cubes,
    totalWeight: row.total_weight,
    memo: cleanMemo,
    status,
  };
}

export async function getMeals(limit = 100): Promise<Meal[]> {
  const { data, error } = await getSupabase()
    .from('meals')
    .select('*')
    .order('date', { ascending: false })
    .order('meal_time', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as MealRow[]).map(rowToMeal);
}

export async function createMeal(
  cubes: CubeUsage[],
  memo: string,
  date: string,
  mealType: MealType,
): Promise<Meal> {
  const totalWeight = cubes.reduce((sum, c) => sum + c.weight * c.quantity, 0);

  const { data: row, error } = await getSupabase()
    .from('meals')
    .insert({
      date,
      meal_time: mealTimeForDate(date),
      cubes: JSON.stringify(cubes),
      total_weight: totalWeight,
      memo: encodeMemo(memo || '', 'planned', mealType),
    })
    .select()
    .single();

  if (error) throw error;
  return rowToMeal(row as MealRow);
}

export async function updateMeal(
  id: string,
  cubes: CubeUsage[],
  memo: string,
  date: string,
  mealType: MealType,
): Promise<Meal> {
  const totalWeight = cubes.reduce((sum, c) => sum + c.weight * c.quantity, 0);

  // Preserve existing status
  const { data: existing } = await getSupabase()
    .from('meals')
    .select('memo')
    .eq('id', id)
    .single();
  const currentStatus = existing ? parseMemo((existing as { memo: string }).memo).status : 'planned';

  const { data: row, error } = await getSupabase()
    .from('meals')
    .update({
      date,
      meal_time: mealTimeForDate(date),
      cubes: JSON.stringify(cubes),
      total_weight: totalWeight,
      memo: encodeMemo(memo || '', currentStatus, mealType),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToMeal(row as MealRow);
}

export async function setMealStatus(id: string, status: MealStatus): Promise<Meal> {
  const { data: existing, error: fetchErr } = await getSupabase()
    .from('meals')
    .select('memo')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;

  const { cleanMemo, mealType } = parseMemo((existing as { memo: string }).memo);

  const { data: row, error } = await getSupabase()
    .from('meals')
    .update({ memo: encodeMemo(cleanMemo, status, mealType) })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToMeal(row as MealRow);
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await getSupabase().from('meals').delete().eq('id', id);
  if (error) throw error;
}
